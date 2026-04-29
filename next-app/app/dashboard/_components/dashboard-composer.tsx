"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  submitDashboardChatTurnRequest,
  submitDashboardChatTurnStreamRequest,
  type DashboardMessage,
} from "@/lib/dashboard/chat-api";

import styles from "../page.module.scss";

const PENDING_THREAD_STORAGE_KEY = "dashboard-chat:pending-route";

function persistPendingRoute(payload: {
  routeKind: "thread" | "match";
  routeId: string;
  threadId: string;
  userMessage: DashboardMessage;
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_THREAD_STORAGE_KEY, JSON.stringify(payload));
}

function clearPendingRoute() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_THREAD_STORAGE_KEY);
}

export function DashboardComposer() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function handleSuggestion(event: Event) {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;

      if (typeof prompt === "string" && prompt.trim()) {
        setMessage(prompt);
        setReply(null);
      }
    }

    window.addEventListener("dashboard-chat:suggestion", handleSuggestion);

    return () => {
      window.removeEventListener("dashboard-chat:suggestion", handleSuggestion);
    };
  }, []);

  function resolvePayload() {
    const threadMatch = pathname.match(/^\/dashboard\/threads\/([^/]+)$/);
    const matchMatch = pathname.match(/^\/dashboard\/matches\/([^/]+)$/);

    if (threadMatch) {
      return {
        source: "thread" as const,
        threadId: decodeURIComponent(threadMatch[1]),
        message,
      };
    }

    if (matchMatch) {
      return {
        source: "match" as const,
        matchId: decodeURIComponent(matchMatch[1]),
        message,
      };
    }

    return {
      source: "new-chat" as const,
      message,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim() || isSending) {
      return;
    }

    const nextMessage = message.trim();
    setIsSending(true);
    setReply(null);
    const payload = {
      ...resolvePayload(),
      message: nextMessage,
    };

    try {
      let streamStarted = false;
      let streamMeta:
        | {
            threadId: string;
            routeKind: "thread" | "match";
            routeId: string;
            userMessage: DashboardMessage;
          }
        | null = null;

      await submitDashboardChatTurnStreamRequest(payload, {
        onMeta: (meta) => {
          streamStarted = true;
          streamMeta = meta;
          setMessage("");
          persistPendingRoute(meta);
          window.dispatchEvent(
            new CustomEvent("dashboard-chat:pending-start", {
              detail: {
                source: payload.source,
                threadId: meta.threadId,
                routeKind: meta.routeKind,
                routeId: meta.routeId,
                matchId: meta.routeKind === "match" ? meta.routeId : undefined,
                message: meta.userMessage.content,
              },
            }),
          );

          if (meta.routeKind === "thread") {
            router.push(`/dashboard/threads/${meta.threadId}`);
          } else {
            router.push(`/dashboard/matches/${meta.routeId}`);
          }
        },
        onAssistantDelta: (delta) => {
          window.dispatchEvent(
            new CustomEvent("dashboard-chat:pending-delta", {
              detail: { delta },
            }),
          );
        },
        onAssistantDone: (donePayload) => {
          clearPendingRoute();
          window.dispatchEvent(
            new CustomEvent("dashboard-chat:assistant-done", {
              detail: {
                ...donePayload,
                userMessage: streamMeta?.userMessage ?? null,
              },
            }),
          );
          window.dispatchEvent(
            new CustomEvent("dashboard-chat:refresh", {
              detail: {
                scope: "lists",
              },
            }),
          );
          window.dispatchEvent(new CustomEvent("dashboard-chat:pending-end"));
        },
      });

      if (!streamStarted) {
        throw new Error("The chat stream did not start.");
      }
    } catch (error) {
      try {
        const result = await submitDashboardChatTurnRequest(payload);

        setMessage("");
        clearPendingRoute();
        window.dispatchEvent(
          new CustomEvent("dashboard-chat:assistant-done", {
            detail: {
              ...result,
              userMessage: result.userMessage,
            },
          }),
        );
        window.dispatchEvent(
          new CustomEvent("dashboard-chat:refresh", {
            detail: {
              scope: "lists",
            },
          }),
        );
        window.dispatchEvent(new CustomEvent("dashboard-chat:pending-end"));

        if (result.routeKind === "thread") {
          router.push(`/dashboard/threads/${result.threadId}`);
        } else {
          router.push(`/dashboard/matches/${result.routeId}`);
        }
      } catch (fallbackError) {
        clearPendingRoute();
        window.dispatchEvent(new CustomEvent("dashboard-chat:pending-end"));
        setReply(
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : "We couldn't send that message.",
        );
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <footer className={styles.composerShell}>
      <form className={styles.composer} onSubmit={handleSubmit}>
        {reply ? <p className={styles.composerReply}>{reply}</p> : null}
        <div className={styles.composerRow}>
          <button
            aria-label="Switch to keyboard"
            className={styles.composerIconButton}
            type="button"
          >
            ⌨
          </button>
          <input
            aria-label="Message Glint"
            className={styles.composerInput}
            disabled={isSending}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message Glint..."
            type="text"
            value={message}
          />
          <button className={styles.composerSendButton} disabled={isSending} type="submit">
            {isSending ? "Sending" : "Send"}
          </button>
        </div>
      </form>
    </footer>
  );
}
