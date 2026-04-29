"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  archiveDashboardThreadRequest,
  getDashboardThreadRequest,
  renameDashboardThreadRequest,
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

type ThreadViewProps = {
  threadId: string;
};

export function ThreadView({ threadId }: ThreadViewProps) {
  const router = useRouter();
  const [thread, setThread] = useState<DashboardThread | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingDashboardMessage[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

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
        setPendingMessages([]);
        void loadThread();
      }
    }

    function handlePendingStart(event: Event) {
      const detail = (event as CustomEvent<{ source?: string; threadId?: string; message?: string }>).detail;

      if (detail?.source === "thread" && detail.threadId === threadId && detail.message) {
        setPendingMessages([
          {
            id: `pending-user-${Date.now()}`,
            role: "user",
            content: detail.message,
          },
          {
            id: `pending-assistant-${Date.now()}`,
            role: "assistant",
            content: "Glint is thinking...",
          },
        ]);
      }
    }

    function handlePendingEnd() {
      setPendingMessages([]);
    }

    void loadThread();
    window.addEventListener("dashboard-chat:refresh", handleRefresh);
    window.addEventListener("dashboard-chat:pending-start", handlePendingStart);
    window.addEventListener("dashboard-chat:pending-end", handlePendingEnd);

    return () => {
      isMounted = false;
      window.removeEventListener("dashboard-chat:refresh", handleRefresh);
      window.removeEventListener("dashboard-chat:pending-start", handlePendingStart);
      window.removeEventListener("dashboard-chat:pending-end", handlePendingEnd);
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

  async function handleRenameThread() {
    if (!thread || isRenaming || isArchiving) {
      return;
    }

    const proposedTitle = window.prompt("Rename this chat", thread.title ?? "");

    if (proposedTitle === null) {
      return;
    }

    const nextTitle = proposedTitle.trim();

    if (!nextTitle) {
      setActionMessage("A chat title can't be empty.");
      return;
    }

    setIsRenaming(true);
    setActionMessage(null);

    try {
      const response = await renameDashboardThreadRequest(thread.id, nextTitle);
      setThread(response.thread);
      setActionMessage("Chat renamed.");
      window.dispatchEvent(new CustomEvent("dashboard-chat:refresh", { detail: { threadId } }));
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "We couldn't rename that chat right now.",
      );
    } finally {
      setIsRenaming(false);
    }
  }

  async function handleArchiveThread() {
    if (!thread || isArchiving || isRenaming) {
      return;
    }

    const shouldArchive = window.confirm(
      "Archive this chat? It will disappear from Recent Chats, but the messages will stay in the database.",
    );

    if (!shouldArchive) {
      return;
    }

    setIsArchiving(true);
    setActionMessage(null);

    try {
      await archiveDashboardThreadRequest(thread.id);
      window.dispatchEvent(new CustomEvent("dashboard-chat:refresh"));
      router.push("/dashboard");
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "We couldn't archive that chat right now.",
      );
      setIsArchiving(false);
    }
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
        <div className={styles.inlineActionRow}>
          <button
            className={styles.textActionButton}
            disabled={isRenaming || isArchiving}
            onClick={() => void handleRenameThread()}
            type="button"
          >
            {isRenaming ? "Renaming..." : "Rename"}
          </button>
          <button
            className={styles.textActionButton}
            disabled={isArchiving || isRenaming}
            onClick={() => void handleArchiveThread()}
            type="button"
          >
            {isArchiving ? "Archiving..." : "Archive"}
          </button>
        </div>
        {actionMessage ? <p className={styles.inlineStatus}>{actionMessage}</p> : null}
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
      <DashboardPendingMessageList messages={pendingMessages} />
    </div>
  );
}
