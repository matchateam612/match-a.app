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
import { DashboardSuggestionChips } from "./dashboard-suggestion-chips";

type MatchThreadViewProps = {
  matchId: string;
};

export function MatchThreadView({ matchId }: MatchThreadViewProps) {
  const [thread, setThread] = useState<DashboardThread | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
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
        void loadMatchThread();
      }
    }

    void loadMatchThread();
    window.addEventListener("dashboard-chat:refresh", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("dashboard-chat:refresh", handleRefresh);
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
    </div>
  );
}
