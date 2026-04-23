"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { listMatchThreadsRequest, type MatchThread } from "@/lib/matches/match-api";
import styles from "../page.module.scss";

type MatchThreadViewProps = {
  matchId: string;
};

export function MatchThreadView({ matchId }: MatchThreadViewProps) {
  const [match, setMatch] = useState<MatchThread | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(
    "loading",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMatch() {
      setState("loading");

      try {
        const response = await listMatchThreadsRequest();
        const nextMatch =
          response.threads.find((thread) => thread.id === matchId) ?? null;

        if (isMounted) {
          setMatch(nextMatch);
          setState(nextMatch ? "ready" : "missing");
        }
      } catch {
        if (isMounted) {
          setMatch(null);
          setState("error");
        }
      }
    }

    void loadMatch();

    return () => {
      isMounted = false;
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

  if (!match) {
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
          <div className={styles.assistantBubble}>
            I found someone worth looking at. {summary} Would you like to
            explore what you two may have in common?
          </div>

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
                <p className={styles.matchLocation}>
                  {match.statusLabel ?? "Potential match"}
                </p>
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

      <section className={styles.userMessageRow}>
        <div className={styles.userBubble}>
          She seems interesting. Tell me more about the strongest overlap.
        </div>
        <div className={styles.userAvatar}>A</div>
      </section>
    </div>
  );
}
