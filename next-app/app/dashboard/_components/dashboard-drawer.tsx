"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { listMatchThreadsRequest, type MatchThread } from "@/lib/matches/match-api";
import styles from "../page.module.scss";

const agentThreads = [
  { id: "tonight-plans", label: "Tonight plans" },
  { id: "profile-tune-up", label: "Profile tune-up" },
  { id: "match-strategy", label: "Match strategy" },
] as const;

type DashboardDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DashboardDrawer({ isOpen, onClose }: DashboardDrawerProps) {
  const pathname = usePathname();
  const [areMatchesOpen, setAreMatchesOpen] = useState(true);
  const [matchThreads, setMatchThreads] = useState<MatchThread[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

    void loadMatchThreads();

    return () => {
      isMounted = false;
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
            <span>Main Reflection</span>
          </Link>

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

          <div className={styles.drawerSectionLabel}>Agent Threads</div>
          {agentThreads.map((thread) => {
            const href = `/dashboard/threads/${thread.id}`;
            const isActive = pathname === href;

            return (
              <Link
                className={
                  isActive ? styles.drawerItemActive : styles.drawerItem
                }
                href={href}
                key={thread.id}
                onClick={onClose}
              >
                <span aria-hidden="true">◌</span>
                <span>{thread.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
