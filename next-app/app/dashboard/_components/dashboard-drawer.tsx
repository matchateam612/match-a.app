"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  deleteDashboardThreadRequest,
  listDashboardThreadsRequest,
  renameDashboardThreadRequest,
  type DashboardThread,
} from "@/lib/dashboard/chat-api";
import { listMatchThreadsRequest, type MatchThread } from "@/lib/matches/match-api";
import styles from "../page.module.scss";

type DashboardDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DashboardDrawer({ isOpen, onClose }: DashboardDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [areMatchesOpen, setAreMatchesOpen] = useState(true);
  const [generalThreads, setGeneralThreads] = useState<DashboardThread[]>([]);
  const [matchThreads, setMatchThreads] = useState<MatchThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [threadActionId, setThreadActionId] = useState<string | null>(null);
  const [busyThreadId, setBusyThreadId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  function formatThreadPrimaryText(thread: DashboardThread) {
    return thread.title ?? thread.latest_message_preview ?? "Untitled chat";
  }

  function formatThreadTimestamp(value: string | null) {
    if (!value) {
      return "";
    }

    const timestamp = new Date(value);

    if (Number.isNaN(timestamp.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(timestamp);
  }

  function formatMatchLabel(thread: MatchThread) {
    const ageSuffix = thread.age ? `, ${thread.age}` : "";
    return `${thread.label}${ageSuffix}`;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadGeneralThreads() {
      try {
        const activeResponse = await listDashboardThreadsRequest();

        if (isMounted) {
          setGeneralThreads(activeResponse.threads);
          setIsLoadingThreads(false);
        }
      } catch {
        if (isMounted) {
          setGeneralThreads([]);
          setIsLoadingThreads(false);
        }
      }
    }

    async function loadMatchThreads() {
      try {
        const response = await listMatchThreadsRequest();

        if (isMounted) {
          setMatchThreads(response.threads);
          setIsLoadingMatches(false);
        }
      } catch {
        if (isMounted) {
          setMatchThreads([]);
          setIsLoadingMatches(false);
        }
      }
    }

    function handleRefresh() {
      setIsLoadingThreads(true);
      setIsLoadingMatches(true);
      void loadGeneralThreads();
      void loadMatchThreads();
    }

    void loadGeneralThreads();
    void loadMatchThreads();
    window.addEventListener("dashboard-chat:refresh", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("dashboard-chat:refresh", handleRefresh);
    };
  }, []);

  useEffect(() => () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
    }
  }, []);

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startLongPress(threadId: string) {
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      setThreadActionId(threadId);
    }, 420);
  }

  async function handleRenameThread(thread: DashboardThread) {
    if (busyThreadId) {
      return;
    }

    const proposedTitle = window.prompt("Rename this chat", thread.title ?? "");

    if (proposedTitle === null) {
      return;
    }

    const nextTitle = proposedTitle.trim();

    if (!nextTitle) {
      return;
    }

    try {
      setBusyThreadId(thread.id);
      const response = await renameDashboardThreadRequest(thread.id, nextTitle);
      setGeneralThreads((current) =>
        current.map((entry) => (entry.id === thread.id ? response.thread : entry)),
      );
    } catch {
      // Keep the drawer quiet for now.
    } finally {
      setBusyThreadId(null);
      setThreadActionId(null);
    }
  }

  async function handleDeleteThread(thread: DashboardThread) {
    if (busyThreadId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this chat permanently? This will remove the thread and all of its messages.",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setBusyThreadId(thread.id);
      await deleteDashboardThreadRequest(thread.id);
      setGeneralThreads((current) => current.filter((entry) => entry.id !== thread.id));
      setThreadActionId(null);

      if (pathname === `/dashboard/threads/${thread.id}`) {
        router.push("/dashboard");
      }

      window.dispatchEvent(new CustomEvent("dashboard-chat:refresh", { detail: { scope: "lists" } }));
    } catch {
      // Keep the drawer quiet for now.
    } finally {
      setBusyThreadId(null);
    }
  }

  return (
    <>
      <button
        aria-label="Close menu"
        className={isOpen ? styles.drawerScrimOpen : styles.drawerScrim}
        onClick={onClose}
        type="button"
      />

      <aside
        aria-label="Dashboard menu"
        className={isOpen ? styles.drawerOpen : styles.drawer}
      >
        <div className={styles.drawerProfile}>
          <div className={styles.drawerAvatar} />
          <div>
            <p className={styles.drawerName}>Alex</p>
            <p className={styles.drawerKicker}>Glint workspace</p>
          </div>
        </div>

        <nav className={styles.drawerNav}>
          <Link
            className={
              pathname === "/dashboard"
                ? styles.drawerItemActive
                : styles.drawerItem
            }
            href="/dashboard"
            onClick={onClose}
          >
            <span aria-hidden="true">✦</span>
            <span>New Chat</span>
          </Link>

          <button
            aria-expanded={areMatchesOpen}
            className={styles.drawerGroupButton}
            onClick={() => setAreMatchesOpen((isOpenState) => !isOpenState)}
            type="button"
          >
            <span className={styles.drawerGroupLabel}>
              <span aria-hidden="true">♡</span>
              <span>Matches</span>
            </span>
            <span className={styles.drawerCount}>
              {isLoadingMatches ? "…" : matchThreads.length}
            </span>
          </button>

          {areMatchesOpen ? (
            <div className={styles.drawerSubList}>
              {matchThreads.length > 0 ? matchThreads.map((thread) => {
                const href = `/dashboard/matches/${thread.id}`;
                const isActive = pathname === href;

                return (
                  <Link
                    className={
                      isActive
                        ? styles.drawerSubItemActive
                        : styles.drawerSubItem
                    }
                    href={href}
                    key={thread.id}
                    onClick={onClose}
                  >
                    <span className={styles.drawerItemBody}>
                      <span className={styles.drawerThreadRow}>
                        <span className={styles.drawerThreadName}>{formatMatchLabel(thread)}</span>
                      </span>
                      <span className={styles.drawerThreadPreview}>
                        {thread.matchReason ?? thread.agentSummary ?? "Open this match to keep talking with Glint."}
                      </span>
                    </span>
                    {thread.unread ? (
                      <span
                        aria-label="Unread match"
                        className={styles.unreadDot}
                      />
                    ) : null}
                  </Link>
                );
              }) : (
                <span className={styles.drawerEmptyText}>
                  {isLoadingMatches ? "Loading matches..." : "No matches yet"}
                </span>
              )}
            </div>
          ) : null}

          <div className={styles.drawerSectionLabel}>Recent Chats</div>
          {generalThreads.length > 0 ? generalThreads.map((thread) => {
            const href = `/dashboard/threads/${thread.id}`;
            const isActive = pathname === href;
            const isActionVisible = threadActionId === thread.id;
            const isBusy = busyThreadId === thread.id;

            return (
              <div
                className={styles.drawerThreadCard}
                key={thread.id}
                onMouseEnter={() => setThreadActionId(thread.id)}
                onMouseLeave={() => setThreadActionId((current) => (current === thread.id ? null : current))}
                onTouchEnd={clearLongPressTimer}
                onTouchMove={clearLongPressTimer}
                onTouchStart={() => startLongPress(thread.id)}
              >
                <Link
                  className={isActive ? styles.drawerItemActive : styles.drawerItem}
                  href={href}
                  onClick={onClose}
                >
                  <span aria-hidden="true" className={styles.drawerItemGlyph}>◌</span>
                  <span className={styles.drawerItemBody}>
                    <span className={styles.drawerThreadRow}>
                      <span className={styles.drawerThreadName}>
                        {formatThreadPrimaryText(thread)}
                      </span>
                      {thread.last_message_at ? (
                        <span className={styles.drawerThreadMeta}>
                          {formatThreadTimestamp(thread.last_message_at)}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>

                <div
                  className={
                    isActionVisible
                      ? styles.drawerThreadActionsVisible
                      : styles.drawerThreadActions
                  }
                >
                  <button
                    className={styles.drawerMiniAction}
                    disabled={isBusy}
                    onClick={() => void handleRenameThread(thread)}
                    type="button"
                  >
                    Rename
                  </button>
                  <button
                    className={`${styles.drawerMiniAction} ${styles.drawerMiniActionDelete}`.trim()}
                    disabled={isBusy}
                    onClick={() => void handleDeleteThread(thread)}
                    type="button"
                  >
                    {isBusy ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          }) : (
            <span className={styles.drawerEmptyText}>
              {isLoadingThreads ? "Loading chats..." : "No recent chats yet"}
            </span>
          )}

          <div className={styles.drawerSectionLabel}>Account</div>
          <Link
            className={
              pathname === "/dashboard/profile"
                ? styles.drawerItemActive
                : styles.drawerItem
            }
            href="/dashboard/profile"
            onClick={onClose}
          >
            <span aria-hidden="true">◎</span>
            <span>Profile</span>
          </Link>
          <Link
            className={
              pathname === "/dashboard/settings"
                ? styles.drawerItemActive
                : styles.drawerItem
            }
            href="/dashboard/settings"
            onClick={onClose}
          >
            <span aria-hidden="true">⚙</span>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
