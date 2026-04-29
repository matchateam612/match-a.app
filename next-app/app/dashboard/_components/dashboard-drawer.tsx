"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { listDashboardThreadsRequest, type DashboardThread } from "@/lib/dashboard/chat-api";
import { listMatchThreadsRequest, type MatchThread } from "@/lib/matches/match-api";
import styles from "../page.module.scss";

type DashboardDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DashboardDrawer({ isOpen, onClose }: DashboardDrawerProps) {
  const pathname = usePathname();
  const [areMatchesOpen, setAreMatchesOpen] = useState(true);
  const [generalThreads, setGeneralThreads] = useState<DashboardThread[]>([]);
  const [matchThreads, setMatchThreads] = useState<MatchThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGeneralThreads() {
      try {
        const response = await listDashboardThreadsRequest();

        if (isMounted) {
          setGeneralThreads(response.threads);
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
                <span aria-hidden="true">◌</span>
                <span className={styles.drawerThreadName}>
                  {thread.title ?? thread.latest_message_preview ?? "Untitled chat"}
                </span>
              </Link>
            );
          }) : (
            <span className={styles.drawerEmptyText}>
              {isLoadingThreads ? "Loading chats..." : "No recent chats yet"}
            </span>
          )}

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
                    <span className={styles.drawerThreadName}>{thread.label}</span>
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
