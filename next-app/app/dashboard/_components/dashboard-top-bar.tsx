"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getProfilePictureRequest } from "@/lib/pictures/picture-api";
import styles from "../page.module.scss";

export function DashboardTopBar() {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const profilePicture = await getProfilePictureRequest();

        if (!isCancelled) {
          setProfilePictureUrl(profilePicture.signedUrl);
        }
      } catch {
        if (!isCancelled) {
          setProfilePictureUrl(null);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <div className={styles.brand}>
          <span aria-hidden="true" className={styles.brandMark}>
            ✦
          </span>
          <h1 className={styles.brandName}>Glint</h1>
        </div>

        <div className={styles.topBarActions}>
          <button
            aria-label="Notifications"
            className={styles.iconButton}
            type="button"
          >
            ◌
          </button>
          <div className={styles.avatar}>
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
          </div>
        </div>
      </div>
    </header>
  );
}
