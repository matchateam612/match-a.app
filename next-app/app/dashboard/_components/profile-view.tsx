"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  agentMemoryToFields,
  basicInfoToFields,
  getDashboardProfileRequest,
  mentalityToFields,
  type DashboardProfile,
  type DisplayField,
} from "@/lib/dashboard/profile-api";
import { signOutCurrentUser } from "@/lib/supabase/auth";
import styles from "../page.module.scss";

type ProfileSectionProps = {
  title: string;
  fields: DisplayField[];
  defaultOpen?: boolean;
};

function ProfileSection({ title, fields, defaultOpen = false }: ProfileSectionProps) {
  return (
    <details className={styles.profileDetails} open={defaultOpen}>
      <summary className={styles.profileSummary}>{title}</summary>
      <div className={styles.profileFieldList}>
        {fields.length > 0 ? (
          fields.map((field) => (
            <div className={styles.profileField} key={field.label}>
              <span className={styles.profileFieldLabel}>{field.label}</span>
              <span className={styles.profileFieldValue}>{field.value}</span>
            </div>
          ))
        ) : (
          <p className={styles.profileEmptyText}>Nothing saved here yet.</p>
        )}
      </div>
    </details>
  );
}

export function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const response = await getDashboardProfileRequest();

        if (isMounted) {
          setProfile(response);
        }
      } catch {
        if (isMounted) {
          setProfile(null);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOutCurrentUser();
      router.replace("/signin");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className={styles.profilePage}>
      <section className={styles.profileHero}>
        <button
          aria-label="View large profile photo"
          className={styles.profilePhotoButton}
          onClick={() => setIsPhotoOpen(true)}
          type="button"
        >
          {profile?.profilePictureUrl ? (
            <Image
              src={profile.profilePictureUrl}
              alt="Your profile picture"
              fill
              unoptimized
              sizes="112px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span aria-hidden="true" className={styles.profilePhotoFallback} />
          )}
        </button>
        <div>
          <p className={styles.eyebrow}>Your Profile</p>
          <h2 className={styles.profilePageTitle}>Your Glint profile</h2>
        </div>
      </section>

      <section className={styles.profileDetailsBox}>
        <ProfileSection
          defaultOpen
          fields={profile ? basicInfoToFields(profile) : []}
          title="My basic info"
        />
        <ProfileSection
          fields={profile ? mentalityToFields(profile) : []}
          title="My mentality"
        />
        <ProfileSection
          fields={profile ? agentMemoryToFields(profile) : []}
          title="Agent Memory"
        />
      </section>

      <button
        className={styles.signOutButton}
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>

      {isPhotoOpen && profile?.profilePictureUrl ? (
        <button
          aria-label="Close large profile photo"
          className={styles.photoLightbox}
          onClick={() => setIsPhotoOpen(false)}
          type="button"
        >
          <Image
            src={profile.profilePictureUrl}
            alt="Your large profile picture"
            fill
            unoptimized
            sizes="90vw"
            style={{ objectFit: "contain" }}
          />
        </button>
      ) : null}
    </div>
  );
}
