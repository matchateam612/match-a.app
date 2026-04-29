"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  getDashboardMatchThreadRequest,
  type DashboardMessage,
  type DashboardThread,
} from "@/lib/dashboard/chat-api";
import { listMatchThreadsRequest, type MatchThread } from "@/lib/matches/match-api";

import styles from "../page.module.scss";
import { DashboardMessageList } from "./dashboard-message-list";
import {
  DashboardPendingMessageList,
  type PendingDashboardMessage,
} from "./dashboard-pending-message-list";
import { DashboardSuggestionChips } from "./dashboard-suggestion-chips";

type MatchThreadViewProps = {
  matchId: string;
};

export function MatchThreadView({ matchId }: MatchThreadViewProps) {
  const [thread, setThread] = useState<DashboardThread | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingDashboardMessage[]>([]);
  const [match, setMatch] = useState<MatchThread | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadMatchThread() {
      setState("loading");

      try {
        const [threadResponse, matchResponse] = await Promise.all([
          getDashboardMatchThreadRequest(matchId),
          listMatchThreadsRequest(),
        ]);
        const nextMatch = threadResponse.matchContext
          ? matchResponse.threads.find((entry) => entry.id === matchId) ?? null
          : null;

        if (isMounted) {
          setThread(threadResponse.thread);
          setMessages(threadResponse.messages);
          setMatch(nextMatch);
          setState(nextMatch ? "ready" : "missing");
        }
      } catch {
        if (isMounted) {
          setThread(null);
          setMessages([]);
          setMatch(null);
          setState("error");
        }
      }
    }

    function handleRefresh(event: Event) {
      const detail = (event as CustomEvent<{ routeKind?: string; routeId?: string }>).detail;

      if (!detail || (detail.routeKind === "match" && detail.routeId === matchId) || !detail.routeKind) {
        setPendingMessages([]);
        void loadMatchThread();
      }
    }

    function handlePendingStart(event: Event) {
      const detail = (event as CustomEvent<{ source?: string; matchId?: string; message?: string }>).detail;

      if (detail?.source === "match" && detail.matchId === matchId && detail.message) {
        setPendingMessages([
          {
            id: `pending-user-${Date.now()}`,
            role: "user",
            content: detail.message,
          },
          {
            id: `pending-assistant-${Date.now()}`,
            role: "assistant",
            content: "Glint is looking through this match...",
          },
        ]);
      }
    }

    function handlePendingDelta(event: Event) {
      const detail = (event as CustomEvent<{ delta?: string }>).detail;

      if (!detail?.delta) {
        return;
      }

      setPendingMessages((current) => {
        if (current.length === 0) {
          return current;
        }

        return current.map((message, index) =>
          index === current.length - 1 && message.role === "assistant"
            ? {
                ...message,
                content:
                  message.content === "Glint is looking through this match..."
                    ? detail.delta
                    : `${message.content}${detail.delta}`,
              }
            : message,
        );
      });
    }

    function handlePendingEnd() {
      setPendingMessages([]);
    }

    void loadMatchThread();
    window.addEventListener("dashboard-chat:refresh", handleRefresh);
    window.addEventListener("dashboard-chat:pending-start", handlePendingStart);
    window.addEventListener("dashboard-chat:pending-delta", handlePendingDelta);
    window.addEventListener("dashboard-chat:pending-end", handlePendingEnd);

    return () => {
      isMounted = false;
      window.removeEventListener("dashboard-chat:refresh", handleRefresh);
      window.removeEventListener("dashboard-chat:pending-start", handlePendingStart);
      window.removeEventListener("dashboard-chat:pending-delta", handlePendingDelta);
      window.removeEventListener("dashboard-chat:pending-end", handlePendingEnd);
    };
  }, [matchId]);

  if (state === "loading") {
    return (
      <div className={styles.chatCanvas}>
        <section className={styles.messageCluster}>
          <div className={styles.assistantAvatar}>✦</div>
          <div className={styles.assistantBubble}>Loading this match...</div>
        </section>
      </div>
    );
  }

  if (!match || !thread) {
    return (
      <div className={styles.chatCanvas}>
        <section className={styles.messageCluster}>
          <div className={styles.assistantAvatar}>✦</div>
          <div className={styles.assistantBubble}>
            {state === "missing"
              ? "I couldn't find that match in your current list."
              : "I couldn't load this match right now."}
          </div>
        </section>
      </div>
    );
  }

  const tags = [
    match.relationshipIntent,
    match.genderIdentity,
    match.ethnicity,
  ].filter((tag): tag is string => Boolean(tag));
  const summary =
    match.matchReason ??
    match.agentSummary ??
    match.mentalitySummary ??
    "I found this profile in your secure match list.";

  return (
    <div className={styles.chatCanvas}>
      <section className={styles.messageCluster}>
        <div className={styles.assistantAvatar}>✦</div>
        <div className={styles.messageStack}>
          {messages.length === 0 ? (
            <div className={styles.assistantBubble}>
              I found someone worth looking at. {summary} Ask me what stands out, what you may have
              in common, or how you might start the conversation.
            </div>
          ) : null}

          <article className={styles.matchFeatureCard}>
            <div className={styles.matchPhoto}>
              {match.profilePictureUrl ? (
                <Image
                  src={match.profilePictureUrl}
                  alt={`${match.label} profile picture`}
                  fill
                  unoptimized
                  sizes="(max-width: 720px) 90vw, 620px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span>{match.label.slice(0, 1)}</span>
              )}
            </div>
            <div className={styles.matchCardBody}>
              <div>
                <h3 className={styles.matchName}>
                  {match.label}
                  {match.age ? `, ${match.age}` : ""}
                </h3>
                <p className={styles.matchLocation}>{match.statusLabel ?? "Potential match"}</p>
              </div>
              {tags.length > 0 ? (
                <div className={styles.matchTags}>
                  {tags.map((tag) => (
                    <span className={styles.matchTag} key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>

      {messages.length === 0 ? (
        <DashboardSuggestionChips
          prompts={[
            "What stands out most about this person?",
            "What could we realistically have in common?",
            "What should I ask first if I message them?",
          ]}
        />
      ) : null}

      <DashboardMessageList messages={messages} />
      <DashboardPendingMessageList messages={pendingMessages} />
    </div>
  );
}
