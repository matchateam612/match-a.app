"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { submitDashboardChatTurnRequest } from "@/lib/dashboard/chat-api";

import styles from "../page.module.scss";

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

    window.dispatchEvent(
      new CustomEvent("dashboard-chat:pending-start", {
        detail: payload,
      }),
    );

    try {
      const result = await submitDashboardChatTurnRequest(payload);

      setMessage("");
      window.dispatchEvent(
        new CustomEvent("dashboard-chat:refresh", {
          detail: {
            threadId: result.threadId,
            routeKind: result.routeKind,
            routeId: result.routeId,
          },
        }),
      );
      window.dispatchEvent(new CustomEvent("dashboard-chat:pending-end"));

      if (result.routeKind === "thread") {
        router.push(`/dashboard/threads/${result.threadId}`);
      } else {
        router.push(`/dashboard/matches/${result.routeId}`);
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent("dashboard-chat:pending-end"));
      setReply(error instanceof Error ? error.message : "We couldn't send that message.");
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
