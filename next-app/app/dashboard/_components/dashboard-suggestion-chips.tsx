"use client";

import styles from "../page.module.scss";

type DashboardSuggestionChipsProps = {
  prompts: string[];
};

export function DashboardSuggestionChips({ prompts }: DashboardSuggestionChipsProps) {
  function handleClick(prompt: string) {
    window.dispatchEvent(
      new CustomEvent("dashboard-chat:suggestion", {
        detail: { prompt },
      }),
    );
  }

  return (
    <div className={styles.suggestionRow}>
      {prompts.map((prompt) => (
        <button
          className={styles.suggestionChip}
          key={prompt}
          onClick={() => handleClick(prompt)}
          type="button"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
