"use client";

import { FormEvent, useState } from "react";

import styles from "../page.module.scss";

export function DashboardComposer() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    setMessage("");
    setReply("Service currently unavaliable");
  }

  return (
    <footer className={styles.composerShell}>
      <form className={styles.composer} onSubmit={handleSubmit}>
        {reply ? <p className={styles.composerReply}>{reply}</p> : null}
        <div className={styles.composerRow}>
          <button
            aria-label="Switch to keyboard"
            className={styles.composerIconButton}
            type="button"
          >
            ⌨
          </button>
          <input
            aria-label="Message Glint"
            className={styles.composerInput}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask Glint about this..."
            type="text"
            value={message}
          />
          <button className={styles.composerSendButton} type="submit">
            Send
          </button>
        </div>
      </form>
    </footer>
  );
}
