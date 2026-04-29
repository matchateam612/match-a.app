"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { SharedContactType } from "@/lib/supabase/types";
import type { RippleCard } from "../_lib/ripple-types";
import styles from "../page.module.scss";

type PotentialRipplesSectionProps = {
  isLoading: boolean;
  onSaveSharedContact: (matchId: string, type: SharedContactType, value: string) => Promise<void>;
  onToggleDecline: (matchId: string, declined: boolean, reason?: string) => Promise<void>;
  ripples: RippleCard[];
};

const CONTACT_OPTIONS: Array<{ label: string; value: SharedContactType }> = [
  { label: "Phone", value: "phone" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Instagram", value: "instagram" },
  { label: "WeChat", value: "wechat" },
];

export function PotentialRipplesSection({
  isLoading,
  onSaveSharedContact,
  onToggleDecline,
  ripples,
}: PotentialRipplesSectionProps) {
  const [activeDeclineId, setActiveDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [contactType, setContactType] = useState<SharedContactType>("phone");
  const [contactValue, setContactValue] = useState("");
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [errorByMatchId, setErrorByMatchId] = useState<Record<string, string>>({});

  const rippleCountLabel = useMemo(() => `${ripples.length} ready`, [ripples.length]);

  function resetDeclineForm() {
    setActiveDeclineId(null);
    setDeclineReason("");
  }

  function resetContactForm() {
    setActiveContactId(null);
    setContactType("phone");
    setContactValue("");
  }

  function openContactForm(ripple: RippleCard) {
    resetDeclineForm();
    setActiveContactId(ripple.id);
    setContactType(ripple.sharedContactType ?? "phone");
    setContactValue(ripple.sharedContactValue ?? "");
    setErrorByMatchId((current) => ({ ...current, [ripple.id]: "" }));
  }

  function openDeclineForm(ripple: RippleCard) {
    resetContactForm();
    setActiveDeclineId(ripple.id);
    setDeclineReason(ripple.declineReason ?? "");
    setErrorByMatchId((current) => ({ ...current, [ripple.id]: "" }));
  }

  async function submitDecline(matchId: string) {
    try {
      setBusyMatchId(matchId);
      setErrorByMatchId((current) => ({ ...current, [matchId]: "" }));
      await onToggleDecline(matchId, true, declineReason);
      resetDeclineForm();
    } catch (error) {
      setErrorByMatchId((current) => ({
        ...current,
        [matchId]: error instanceof Error ? error.message : "We couldn't save that decline yet.",
      }));
    } finally {
      setBusyMatchId(null);
    }
  }

  async function toggleUndoDecline(matchId: string) {
    try {
      setBusyMatchId(matchId);
      setErrorByMatchId((current) => ({ ...current, [matchId]: "" }));
      await onToggleDecline(matchId, false);
    } catch (error) {
      setErrorByMatchId((current) => ({
        ...current,
        [matchId]: error instanceof Error ? error.message : "We couldn't update that decline yet.",
      }));
    } finally {
      setBusyMatchId(null);
    }
  }

  async function submitSharedContact(matchId: string) {
    try {
      setBusyMatchId(matchId);
      setErrorByMatchId((current) => ({ ...current, [matchId]: "" }));
      await onSaveSharedContact(matchId, contactType, contactValue);
      resetContactForm();
    } catch (error) {
      setErrorByMatchId((current) => ({
        ...current,
        [matchId]: error instanceof Error ? error.message : "We couldn't save your shared contact yet.",
      }));
    } finally {
      setBusyMatchId(null);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Potential Ripples</h3>
        <span className={styles.sectionLink}>{rippleCountLabel}</span>
      </div>

      <div className={styles.rippleGrid}>
        {!isLoading && ripples.length > 0 ? (
          ripples.map((ripple) => (
            <article className={styles.rippleCard} key={ripple.id}>
              <div className={styles.rippleGlow} />
              <div className={styles.rippleAvatar}>
                {ripple.profilePictureUrl ? (
                  <Image
                    src={ripple.profilePictureUrl}
                    alt={`${ripple.label} profile picture`}
                    fill
                    unoptimized
                    sizes="80px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div aria-hidden="true" className={styles.rippleAvatarFallback} />
                )}
              </div>
              <div className={styles.rippleBody}>
                <div className={styles.rippleHeader}>
                  <h4 className={styles.rippleTitle}>{ripple.label}</h4>
                  {ripple.statusLabel ? (
                    <span className={styles.rippleStatus}>{ripple.statusLabel}</span>
                  ) : null}
                </div>

                {ripple.match_reason ? (
                  <p className={styles.rippleMessage}>{ripple.match_reason}</p>
                ) : (
                  <div className={styles.skeletonBlock} />
                )}

                <div className={styles.rippleMeta}>
                  <span className={styles.rippleMetaLabel}>
                    Match ID: {ripple.id}
                  </span>
                </div>

                <div className={styles.rippleActionRow}>
                  <button
                    className={styles.rippleActionSecondary}
                    disabled={busyMatchId === ripple.id}
                    onClick={() =>
                      ripple.declined
                        ? void toggleUndoDecline(ripple.id)
                        : openDeclineForm(ripple)
                    }
                    type="button"
                  >
                    {busyMatchId === ripple.id && activeDeclineId !== ripple.id
                      ? "Saving..."
                      : ripple.declined
                        ? "Undo Decline"
                        : "Decline"}
                  </button>
                  <button
                    className={styles.rippleActionPrimary}
                    disabled={busyMatchId === ripple.id}
                    onClick={() => openContactForm(ripple)}
                    type="button"
                  >
                    {ripple.hasSharedContact ? "Edit Shared Contact" : "Share my contact"}
                  </button>
                </div>

                {activeDeclineId === ripple.id ? (
                  <div className={styles.rippleInlinePanel}>
                    <label className={styles.rippleFieldLabel} htmlFor={`decline-reason-${ripple.id}`}>
                      Why do you think this user is not a right fit?
                    </label>
                    <textarea
                      className={styles.rippleTextarea}
                      id={`decline-reason-${ripple.id}`}
                      onChange={(event) => setDeclineReason(event.target.value)}
                      rows={3}
                      value={declineReason}
                    />
                    <div className={styles.rippleInlineActions}>
                      <button
                        className={styles.rippleInlineButton}
                        disabled={busyMatchId === ripple.id || !declineReason.trim()}
                        onClick={() => void submitDecline(ripple.id)}
                        type="button"
                      >
                        {busyMatchId === ripple.id ? "Saving..." : "Save decline"}
                      </button>
                      <button
                        className={styles.rippleInlineGhost}
                        disabled={busyMatchId === ripple.id}
                        onClick={resetDeclineForm}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeContactId === ripple.id ? (
                  <div className={styles.rippleInlinePanel}>
                    <label className={styles.rippleFieldLabel} htmlFor={`contact-type-${ripple.id}`}>
                      Choose one way to share your contact
                    </label>
                    <select
                      className={styles.rippleSelect}
                      id={`contact-type-${ripple.id}`}
                      onChange={(event) => setContactType(event.target.value as SharedContactType)}
                      value={contactType}
                    >
                      {CONTACT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      className={styles.rippleInput}
                      onChange={(event) => setContactValue(event.target.value)}
                      placeholder="Enter your contact info"
                      type="text"
                      value={contactValue}
                    />
                    <div className={styles.rippleInlineActions}>
                      <button
                        className={styles.rippleInlineButton}
                        disabled={busyMatchId === ripple.id || !contactValue.trim()}
                        onClick={() => void submitSharedContact(ripple.id)}
                        type="button"
                      >
                        {busyMatchId === ripple.id ? "Saving..." : "Save contact"}
                      </button>
                      <button
                        className={styles.rippleInlineGhost}
                        disabled={busyMatchId === ripple.id}
                        onClick={resetContactForm}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {errorByMatchId[ripple.id] ? (
                  <p className={styles.rippleError}>{errorByMatchId[ripple.id]}</p>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <>
            {Array.from({ length: 2 }).map((_, index) => (
              <article className={styles.rippleCard} key={index}>
                <div className={styles.rippleGlow} />
                <div className={styles.rippleAvatar} />
                <div className={styles.rippleBody}>
                  <div className={styles.skeletonTiny} />
                  <div className={styles.skeletonBlock} />
                  <div className={styles.skeletonShort} />
                  <div className={styles.tagRow}>
                    <span className={styles.skeletonTag} />
                    <span className={styles.skeletonTag} />
                  </div>
                </div>
              </article>
            ))}

            <div className={styles.emptyShell}>
              <div aria-hidden="true" className={styles.emptyOrbit} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
