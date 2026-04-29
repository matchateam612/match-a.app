"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  listDashboardThreadsRequest,
  restoreDashboardThreadRequest,
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
  const [areMatchesOpen, setAreMatchesOpen] = useState(true);
  const [areArchivedOpen, setAreArchivedOpen] = useState(false);
  const [generalThreads, setGeneralThreads] = useState<DashboardThread[]>([]);
  const [archivedThreads, setArchivedThreads] = useState<DashboardThread[]>([]);
  const [matchThreads, setMatchThreads] = useState<MatchThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingArchivedThreads, setIsLoadingArchivedThreads] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  function formatThreadPrimaryText(thread: DashboardThread) {
    return thread.title ?? thread.latest_message_preview ?? "Untitled chat";
  }

  function formatThreadSecondaryText(thread: DashboardThread) {
    return thread.summary ?? thread.latest_message_preview ?? "No preview yet";
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
        const [activeResponse, archivedResponse] = await Promise.all([
          listDashboardThreadsRequest(),
          listDashboardThreadsRequest({ archived: "only" }),
        ]);

        if (isMounted) {
          setGeneralThreads(activeResponse.threads);
          setArchivedThreads(archivedResponse.threads);
          setIsLoadingThreads(false);
          setIsLoadingArchivedThreads(false);
        }
      } catch {
        if (isMounted) {
          setGeneralThreads([]);
          setArchivedThreads([]);
          setIsLoadingThreads(false);
          setIsLoadingArchivedThreads(false);
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
      setIsLoadingArchivedThreads(true);
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

  async function handleRestoreThread(threadId: string) {
    try {
      await restoreDashboardThreadRequest(threadId);
      window.dispatchEvent(new CustomEvent("dashboard-chat:refresh"));
    } catch {
      // Keep the drawer quiet on restore failures for now.
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

          <div className={styles.drawerSectionLabel}>Recent Chats</div>
          {generalThreads.length > 0 ? generalThreads.map((thread) => {
            const href = `/dashboard/threads/${thread.id}`;
            const isActive = pathname === href;

            return (
              <Link
                className={isActive ? styles.drawerItemActive : styles.drawerItem}
                href={href}
                key={thread.id}
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
                  <span className={styles.drawerThreadPreview}>
                    {formatThreadSecondaryText(thread)}
                  </span>
                </span>
              </Link>
            );
          }) : (
            <span className={styles.drawerEmptyText}>
              {isLoadingThreads ? "Loading chats..." : "No recent chats yet"}
            </span>
          )}

          <button
            aria-expanded={areArchivedOpen}
            className={styles.drawerGroupButton}
            onClick={() => setAreArchivedOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span className={styles.drawerGroupLabel}>
              <span aria-hidden="true">⌁</span>
              <span>Archived Chats</span>
            </span>
            <span className={styles.drawerCount}>
              {isLoadingArchivedThreads ? "…" : archivedThreads.length}
            </span>
          </button>

          {areArchivedOpen ? (
            <div className={styles.drawerSubList}>
              {archivedThreads.length > 0 ? archivedThreads.map((thread) => (
                <div className={styles.drawerArchivedItem} key={thread.id}>
                  <div className={styles.drawerItemBody}>
                    <span className={styles.drawerThreadRow}>
                      <span className={styles.drawerThreadName}>
                        {formatThreadPrimaryText(thread)}
                      </span>
                      {thread.archived_at ? (
                        <span className={styles.drawerThreadMeta}>
                          {formatThreadTimestamp(thread.archived_at)}
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.drawerThreadPreview}>
                      {formatThreadSecondaryText(thread)}
                    </span>
                  </div>
                  <button
                    className={styles.drawerRestoreButton}
                    onClick={() => void handleRestoreThread(thread.id)}
                    type="button"
                  >
                    Restore
                  </button>
                </div>
              )) : (
                <span className={styles.drawerEmptyText}>
                  {isLoadingArchivedThreads ? "Loading archived chats..." : "No archived chats"}
                </span>
              )}
            </div>
          ) : null}

          <button
            aria-expanded={areMatchesOpen}
            className={styles.drawerGroupButton}
            onClick={() => setAreMatchesOpen((isOpen) => !isOpen)}
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
