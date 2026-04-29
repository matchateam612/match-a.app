"use client";

import { useEffect, useState } from "react";

import {
  getDashboardThreadRequest,
  type DashboardMessage,
  type DashboardThread,
} from "@/lib/dashboard/chat-api";

import styles from "../page.module.scss";
import { DashboardMessageList } from "./dashboard-message-list";
import { DashboardSuggestionChips } from "./dashboard-suggestion-chips";

type ThreadViewProps = {
  threadId: string;
};

export function ThreadView({ threadId }: ThreadViewProps) {
  const [thread, setThread] = useState<DashboardThread | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadThread() {
      setState("loading");

      try {
        const response = await getDashboardThreadRequest(threadId);

        if (isMounted) {
          setThread(response.thread);
          setMessages(response.messages);
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
      const detail = (event as CustomEvent<{ threadId?: string }>).detail;

      if (!detail?.threadId || detail.threadId === threadId) {
        void loadThread();
      }
    }

    void loadThread();
    window.addEventListener("dashboard-chat:refresh", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("dashboard-chat:refresh", handleRefresh);
    };
  }, [threadId]);

  if (state === "loading") {
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
      <section className={styles.homeHero}>
        <p className={styles.eyebrow}>Chat</p>
        <h2 className={styles.homeTitle}>{thread.title ?? "Recent chat"}</h2>
        <p className={styles.heroCopy}>
          This is one of your saved Glint conversations. Keep going below, or start a new one from
          the drawer.
        </p>
      </section>

      {messages.length === 0 ? (
        <DashboardSuggestionChips
          prompts={[
            "Help me sort out what I am feeling right now.",
            "Can you help me draft a message to someone I like?",
            "What should I pay attention to in my dating patterns?",
          ]}
        />
      ) : null}

      <DashboardMessageList messages={messages} />
    </div>
  );
}
