"use client";

import styles from "../../1-basics/page.module.scss";
import type { AgentConversationMode } from "../_lib/agent-types";

type ModePickerProps = {
  selectedMode: AgentConversationMode | null;
  onSelectMode: (mode: AgentConversationMode) => void;
};

const modeCards: Array<{
  mode: AgentConversationMode;
  title: string;
  copy: string;
}> = [
  {
    mode: "voice",
    title: "Talk by voice",
    copy: "Best when the conversation should feel like a natural phone call.",
  },
  {
    mode: "text",
    title: "Chat by text",
    copy: "Best when audio is inconvenient or you want a quieter, easier-to-review flow.",
  },
];

export function ModePicker({ selectedMode, onSelectMode }: ModePickerProps) {
  return (
    <div className={styles.chipGrid}>
      {modeCards.map((card) => {
        const isSelected = card.mode === selectedMode;

        return (
          <button
            key={card.mode}
            type="button"
            className={`${styles.chip} ${isSelected ? styles.chipActive : ""}`}
            aria-pressed={isSelected}
            onClick={() => onSelectMode(card.mode)}
            style={{ textAlign: "left" }}
          >
            <span className={styles.chipTitle}>{card.title}</span>
            <span className={styles.chipCopy}>{card.copy}</span>
          </button>
        );
      })}
    </div>
  );
}
