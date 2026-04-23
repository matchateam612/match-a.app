"use client";

import { useEffect, useState } from "react";

import { listMatchThreadsRequest } from "@/lib/matches/match-api";
import styles from "../page.module.scss";

export function DashboardHome() {
  const [matchCount, setMatchCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMatchCount() {
      try {
        const response = await listMatchThreadsRequest();

        if (isMounted) {
          setMatchCount(response.threads.length);
        }
      } catch {
        if (isMounted) {
          setMatchCount(0);
        }
      }
    }

    void loadMatchCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasMatches = matchCount !== null && matchCount > 0;

  return (
    <div className={styles.chatCanvas}>
      <section className={styles.homeHero}>
        <p className={styles.eyebrow}>Main Reflection</p>
        <h2 className={styles.homeTitle}>What should Glint look into today?</h2>
        <p className={styles.heroCopy}>
          Your AI workspace is centered around conversations. Open the menu to
          review new matches or continue an existing thread.
        </p>
      </section>

      <section className={styles.insightCard}>
        <div>
          <p className={styles.eyebrow}>New Signals</p>
          <h3 className={styles.insightTitle}>
            {matchCount === null
              ? "Checking your secure match list..."
              : hasMatches
                ? `${matchCount} ${matchCount === 1 ? "match is" : "matches are"} ready to discuss.`
                : "No matches are ready yet."}
          </h3>
        </div>
        <p className={styles.insightCopy}>
          {hasMatches
            ? "Open the Matches drawer to start a focused conversation about someone Glint found."
            : "When Glint finds a new match, it will appear inside the Matches drawer as a conversation thread."}
        </p>
      </section>
    </div>
  );
}
