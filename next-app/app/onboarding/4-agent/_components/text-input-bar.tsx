"use client";

import { useState } from "react";

import styles from "../../1-basics/page.module.scss";

type TextInputBarProps = {
  disabled?: boolean;
  onSubmit: (value: string) => void;
};

export function TextInputBar({ disabled = false, onSubmit }: TextInputBarProps) {
  const [value, setValue] = useState("");

  return (
    <div className={styles.stackCard}>
      <span className={styles.inlineLabel}>Text input</span>
      <textarea
        className={styles.input}
        value={value}
        rows={4}
        disabled={disabled}
        placeholder="Type what the user says so we can simulate the next turn."
        onChange={(event) => setValue(event.target.value)}
        style={{ minHeight: 120, resize: "vertical" }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.nextButton}
          disabled={disabled || !value.trim()}
          onClick={() => {
            onSubmit(value.trim());
            setValue("");
          }}
        >
          Add turn
        </button>
      </div>
    </div>
  );
}
