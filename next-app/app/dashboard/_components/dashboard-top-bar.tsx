"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getDashboardProfileRequest } from "@/lib/dashboard/profile-api";
import styles from "../page.module.scss";

type DashboardTopBarProps = {
  onMenuClick: () => void;
};

export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfilePicture() {
      try {
        const profile = await getDashboardProfileRequest();

        if (isMounted) {
          setProfilePictureUrl(profile.profilePictureUrl);
        }
      } catch {
        if (isMounted) {
          setProfilePictureUrl(null);
        }
      }
    }

    void loadProfilePicture();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <button
          aria-label="Open menu"
          className={styles.iconButton}
          onClick={onMenuClick}
          type="button"
        >
          ☰
        </button>

        <div className={styles.brand}>
          <span aria-hidden="true" className={styles.brandMark}>
            ✦
          </span>
          <h1 className={styles.brandName}>Glint</h1>
        </div>

        <div className={styles.topBarActions}>
          <button
            aria-label="More options"
            className={styles.iconButton}
            type="button"
          >
            ⋯
          </button>
          <Link aria-label="Open your profile" className={styles.avatar} href="/dashboard/profile">
            {profilePictureUrl ? (
              <Image
                src={profilePictureUrl}
                alt="Your profile picture"
                fill
                unoptimized
                sizes="40px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div aria-hidden="true" className={styles.avatarFallback} />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
