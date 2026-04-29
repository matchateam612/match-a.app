"use client";

import { useEffect, useState } from "react";

import { listMatchThreadsRequest } from "@/lib/matches/match-api";
import { DashboardSuggestionChips } from "./dashboard-suggestion-chips";
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
        <p className={styles.eyebrow}>New Chat</p>
        <h2 className={styles.homeTitle}>What do you want help thinking through?</h2>
        <p className={styles.heroCopy}>
          Start a fresh conversation here. Once you send your first message,
          Glint will open a real chat thread and save it in your recent history.
        </p>
      </section>

      <DashboardSuggestionChips
        prompts={[
          "Help me understand what I want in a relationship.",
          "Can you help me think through a match I am unsure about?",
          "What patterns should I notice in my dating life?",
        ]}
      />

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
            ? "Open the Matches section when you want a focused conversation about someone Glint found."
            : "When Glint finds a new match, it will appear in the Matches section so you can ask about them directly."}
        </p>
      </section>
    </div>
  );
}
