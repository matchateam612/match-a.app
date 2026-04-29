"use client";

import { useEffect, useState } from "react";

import {
  getDashboardThreadRequest,
  type DashboardMessage,
  type DashboardThread,
} from "@/lib/dashboard/chat-api";

import styles from "../page.module.scss";
import { DashboardMessageList } from "./dashboard-message-list";
import {
  DashboardPendingMessageList,
  type PendingDashboardMessage,
} from "./dashboard-pending-message-list";
import { DashboardSuggestionChips } from "./dashboard-suggestion-chips";

const PENDING_THREAD_STORAGE_KEY = "dashboard-chat:pending-route";

function getStoredPendingMessages(threadId: string): PendingDashboardMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedPending = window.sessionStorage.getItem(PENDING_THREAD_STORAGE_KEY);

  if (!storedPending) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedPending) as {
      routeKind: "thread" | "match";
      routeId: string;
      userMessage: DashboardMessage;
    };

    if (parsed.routeKind !== "thread" || parsed.routeId !== threadId) {
      return [];
    }

    return [
      {
        id: parsed.userMessage.id,
        role: "user",
        content: parsed.userMessage.content,
      },
      {
        id: `pending-assistant-${threadId}`,
        role: "assistant",
        content: "Glint is thinking...",
      },
    ];
  } catch {
    window.sessionStorage.removeItem(PENDING_THREAD_STORAGE_KEY);
    return [];
  }
}

type ThreadViewProps = {
  threadId: string;
};

export function ThreadView({ threadId }: ThreadViewProps) {
  const [thread, setThread] = useState<DashboardThread | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<DashboardMessage | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingDashboardMessage[]>(() =>
    getStoredPendingMessages(threadId),
  );
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadThread() {
      try {
        const response = await getDashboardThreadRequest(threadId);

        if (isMounted) {
          setThread(response.thread);
          setMessages(response.messages);
          setOptimisticUserMessage((current) =>
            current &&
            response.messages.some(
              (message) =>
                message.id === current.id ||
                (message.role === "user" && message.content === current.content),
            )
              ? null
              : current,
          );
          setState("ready");
        }
      } catch (error) {
        if (isMounted) {
          setThread(null);
          setMessages([]);
          setState(error instanceof Error && error.message === "Thread not found." ? "missing" : "error");
        }
      }
    }

    function handleRefresh(event: Event) {
      const detail = (event as CustomEvent<{ threadId?: string; scope?: string }>).detail;

      if (detail?.scope === "lists") {
        return;
      }

      if (!detail?.threadId || detail.threadId === threadId) {
        void loadThread();
      }
    }

    function handlePendingStart(event: Event) {
      const detail = (event as CustomEvent<{ threadId?: string; message?: string; routeKind?: string }>).detail;

      if (detail?.threadId === threadId && detail.message && (!detail.routeKind || detail.routeKind === "thread")) {
        setOptimisticUserMessage({
          id: `optimistic-user-${Date.now()}`,
          thread_id: threadId,
          user_id: "",
          role: "user",
          content: detail.message,
          status: "completed",
          created_at: new Date().toISOString(),
          metadata: {},
        });
        setPendingMessages([
          {
            id: `pending-assistant-${Date.now()}`,
            role: "assistant",
            content: "Glint is thinking...",
          },
        ]);
      }
    }

    function handlePendingDelta(event: Event) {
      const detail = (event as CustomEvent<{ delta?: string }>).detail;

      if (!detail?.delta) {
        return;
      }

      const deltaText = detail.delta;

      setPendingMessages((current) => {
        if (current.length === 0) {
          return current;
        }

        return current.map((message, index) =>
          index === current.length - 1 && message.role === "assistant"
            ? {
                ...message,
                content:
                  message.content === "Glint is thinking..."
                    ? deltaText
                    : `${message.content}${deltaText}`,
              }
            : message,
        );
      });
    }

    function handlePendingEnd() {
      setPendingMessages([]);
    }

    function handleAssistantDone(
      event: Event,
    ) {
      const detail = (
        event as CustomEvent<{
          threadId: string;
          routeKind: "thread" | "match";
          routeId: string;
          userMessage: DashboardMessage | null;
          assistantMessage: DashboardMessage;
        }>
      ).detail;

      if (!detail || detail.routeKind !== "thread" || detail.threadId !== threadId) {
        return;
      }

      setPendingMessages([]);
      setOptimisticUserMessage(null);
      setMessages((current) => {
        const nextMessages = [...current];
        const savedUserMessage = detail.userMessage;

        if (
          savedUserMessage &&
          !nextMessages.some((message) => message.id === savedUserMessage.id)
        ) {
          nextMessages.push(savedUserMessage);
        }

        if (!nextMessages.some((message) => message.id === detail.assistantMessage.id)) {
          nextMessages.push(detail.assistantMessage);
        }

        return nextMessages;
      });
      setThread((current) =>
        current
          ? {
              ...current,
              latest_message_preview: detail.assistantMessage.content,
              last_message_at: detail.assistantMessage.created_at,
            }
          : current,
      );
    }

    void loadThread();
    window.addEventListener("dashboard-chat:refresh", handleRefresh);
    window.addEventListener("dashboard-chat:pending-start", handlePendingStart);
    window.addEventListener("dashboard-chat:pending-delta", handlePendingDelta);
    window.addEventListener("dashboard-chat:pending-end", handlePendingEnd);
    window.addEventListener("dashboard-chat:assistant-done", handleAssistantDone);

    return () => {
      isMounted = false;
      window.removeEventListener("dashboard-chat:refresh", handleRefresh);
      window.removeEventListener("dashboard-chat:pending-start", handlePendingStart);
      window.removeEventListener("dashboard-chat:pending-delta", handlePendingDelta);
      window.removeEventListener("dashboard-chat:pending-end", handlePendingEnd);
      window.removeEventListener("dashboard-chat:assistant-done", handleAssistantDone);
    };
  }, [threadId]);

  if (state === "loading" && pendingMessages.length === 0) {
    return (
      <div className={styles.chatCanvas}>
        <section className={styles.messageCluster}>
          <div className={styles.assistantAvatar}>✦</div>
          <div className={styles.assistantBubble}>Loading this conversation...</div>
        </section>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className={styles.chatCanvas}>
        <section className={styles.messageCluster}>
          <div className={styles.assistantAvatar}>✦</div>
          <div className={styles.assistantBubble}>
            {state === "missing"
              ? "I couldn't find that conversation."
              : "I couldn't load this conversation right now."}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.chatCanvas}>
      {messages.length === 0 ? (
        <DashboardSuggestionChips
          prompts={[
            "Help me sort out what I am feeling right now.",
            "Can you help me draft a message to someone I like?",
            "What should I pay attention to in my dating patterns?",
          ]}
        />
      ) : null}

      <div className={styles.transcriptStack}>
        <DashboardMessageList messages={messages} />
        {optimisticUserMessage ? <DashboardMessageList messages={[optimisticUserMessage]} /> : null}
      </div>
      <DashboardPendingMessageList messages={pendingMessages} />
    </div>
  );
}
