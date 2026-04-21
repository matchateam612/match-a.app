"use client";

import { useState } from "react";

import styles from "../../_shared/onboarding-shell.module.scss";

type TextInputBarProps = {
  disabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void | Promise<void>;
};

export function TextInputBar({
  disabled = false,
  placeholder = "Message the onboarding agent...",
  submitLabel = "Send",
  onSubmit,
}: TextInputBarProps) {
  const [value, setValue] = useState("");

  return (
    <div
      className={styles.stackCard}
      style={{
        gap: 12,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <textarea
        className={styles.input}
        value={value}
        rows={3}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        style={{
          minHeight: 96,
          resize: "none",
          borderRadius: 18,
          background: "#f8fafc",
          paddingTop: 18,
          paddingBottom: 18,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <p className={styles.helper} style={{ margin: 0 }}>
          Press send to continue the conversation.
        </p>
        <button
          type="button"
          className={styles.nextButton}
          disabled={disabled || !value.trim()}
          onClick={() => {
            onSubmit(value.trim());
            setValue("");
          }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
