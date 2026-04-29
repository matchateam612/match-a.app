"use client";

import { useEffect, useMemo, useState } from "react";

import {
  clearDashboardMemoriesRequest,
  deleteDashboardMemoryRequest,
  listDashboardMemoriesRequest,
  type DashboardMemory,
} from "@/lib/dashboard/chat-api";

import styles from "../page.module.scss";

function memoryIcon(kind: string) {
  switch (kind) {
    case "preference":
      return "♡";
    case "value":
      return "◌";
    case "goal":
      return "→";
    case "boundary":
      return "×";
    case "trait":
      return "✦";
    case "concern":
      return "!";
    case "pattern":
      return "≈";
    default:
      return "•";
  }
}

function toKindLabel(kind: string) {
  return kind.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DashboardSettingsPage() {
  const [memories, setMemories] = useState<DashboardMemory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [isClearingMemories, setIsClearingMemories] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMemories() {
      try {
        const response = await listDashboardMemoriesRequest();

        if (isMounted) {
          setMemories(response.memories);
          setErrorMessage(null);
          setIsLoadingMemories(false);
        }
      } catch (error) {
        if (isMounted) {
          setMemories([]);
          setErrorMessage(
            error instanceof Error ? error.message : "We couldn't load your saved memories.",
          );
          setIsLoadingMemories(false);
        }
      }
    }

    void loadMemories();

    return () => {
      isMounted = false;
    };
  }, []);

  const personalitySummary = useMemo(() => {
    if (memories.length === 0) {
      return "Learning";
    }

    const topKinds = Array.from(new Set(memories.map((memory) => toKindLabel(memory.kind)))).slice(0, 2);
    return topKinds.join(" & ");
  }, [memories]);

  async function handleDeleteMemory(memoryId: string) {
    try {
      await deleteDashboardMemoryRequest(memoryId);
      setMemories((current) => current.filter((memory) => memory.id !== memoryId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't delete that memory right now.",
      );
    }
  }

  async function handleClearMemories() {
    setIsClearingMemories(true);

    try {
      await clearDashboardMemoriesRequest();
      setMemories([]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "We couldn't clear your memories right now.",
      );
    } finally {
      setIsClearingMemories(false);
    }
  }

  return (
    <div className={styles.settingsPage}>
      <section className={styles.settingsIdentity}>
        <div className={styles.aiAvatarLarge}>
          <span aria-hidden="true">✦</span>
          <span className={styles.aiStatusDot} />
        </div>
        <div>
          <p className={styles.eyebrow}>Settings</p>
          <h2 className={styles.profilePageTitle}>Glint AI</h2>
          <span className={styles.aiModePill}>{personalitySummary}</span>
        </div>
      </section>

      <section className={styles.settingsSection}>
        <div className={styles.settingsSectionHeader}>
          <h3 className={styles.settingsTitle}>Memory Vault</h3>
          <button className={styles.textActionButton} type="button">
            {memories.length} saved
          </button>
        </div>

        {errorMessage ? <p className={styles.inlineStatus}>{errorMessage}</p> : null}

        <div className={styles.memoryList}>
          {isLoadingMemories ? (
            <article className={styles.memoryItem}>
              <div className={styles.memoryIcon}>…</div>
              <div className={styles.memoryBody}>
                <h4>Loading memories</h4>
                <p>Pulling together the things Glint has learned about you.</p>
              </div>
            </article>
          ) : memories.length > 0 ? (
            memories.map((memory) => (
              <article className={styles.memoryItem} key={memory.id}>
                <div className={styles.memoryIcon}>{memoryIcon(memory.kind)}</div>
                <div className={styles.memoryBody}>
                  <h4>{memory.content}</h4>
                  <p>
                    {toKindLabel(memory.kind)}
                    {memory.confidence !== null ? ` • confidence ${Math.round(memory.confidence * 100)}%` : ""}
                  </p>
                </div>
                <button
                  aria-label={`Delete ${memory.content}`}
                  className={styles.memoryDeleteButton}
                  onClick={() => void handleDeleteMemory(memory.id)}
                  type="button"
                >
                  ×
                </button>
              </article>
            ))
          ) : (
            <article className={styles.memoryItem}>
              <div className={styles.memoryIcon}>◌</div>
              <div className={styles.memoryBody}>
                <h4>No saved memories yet</h4>
                <p>As you chat with Glint, durable preferences and patterns will start appearing here.</p>
              </div>
            </article>
          )}
        </div>

        <button className={styles.secondaryWideButton} disabled={isLoadingMemories} type="button">
          Memories update automatically from your chats
        </button>
      </section>

      <section className={styles.settingsSection}>
        <h3 className={styles.settingsTitle}>Personality Profile</h3>
        <div className={styles.personalityPanel}>
          <div className={styles.settingRow}>
            <div>
              <h4>Deep Empathy Mode</h4>
              <p>Glint prioritizes emotional support before solutions.</p>
            </div>
            <button aria-pressed="true" className={styles.toggleOn} type="button">
              <span />
            </button>
          </div>

          <div className={styles.settingRow}>
            <div>
              <h4>Active Listening Memories</h4>
              <p>Durable details from your chats can be reused in future conversations.</p>
            </div>
            <button aria-pressed="true" className={styles.toggleOn} type="button">
              <span />
            </button>
          </div>

          <div className={styles.observationControl}>
            <div className={styles.observationHeader}>
              <h4>Observation Level</h4>
              <span>Analytical</span>
            </div>
            <button
              aria-label="Observation level control"
              className={styles.rangePreview}
              type="button"
            >
              <span />
            </button>
            <div className={styles.rangeLabels}>
              <span>Intuitive</span>
              <span>Balanced</span>
              <span>Analytical</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.dangerPanel}>
        <h3>Danger Zone</h3>
        <p>
          Wiping Glint&apos;s memory will reset its understanding of your personality and
          preferences. This cannot be undone.
        </p>
        <button
          className={styles.dangerButton}
          disabled={isClearingMemories || memories.length === 0}
          onClick={() => void handleClearMemories()}
          type="button"
        >
          {isClearingMemories ? "Clearing..." : "Clear All Memories"}
        </button>
      </section>
    </div>
  );
}
