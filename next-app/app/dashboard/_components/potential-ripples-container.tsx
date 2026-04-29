"use client";

import { useEffect, useState } from "react";

import {
  listMatchThreadsRequest,
  updateMatchDeclineRequest,
  updateMatchSharedContactRequest,
} from "@/lib/matches/match-api";
import type { SharedContactType } from "@/lib/supabase/types";

import type { RippleCard } from "../_lib/ripple-types";
import { PotentialRipplesSection } from "./potential-ripples-section";

type LoadState = "idle" | "loading" | "ready" | "error";

export function PotentialRipplesContainer() {
  const [ripples, setRipples] = useState<RippleCard[]>([]);
  const [state, setState] = useState<LoadState>("idle");

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      setState("loading");

      try {
        const response = await listMatchThreadsRequest();
        const nextRipples: RippleCard[] = response.threads.map((thread) => ({
          id: thread.id,
          label: thread.label,
          match_reason: thread.matchReason,
          statusLabel: thread.statusLabel,
          profilePictureUrl: thread.profilePictureUrl,
          targetUserId: thread.targetUserId,
          declined: thread.declined,
          declineReason: thread.declineReason,
          sharedContactType: thread.sharedContactType,
          sharedContactValue: thread.sharedContactValue,
          hasSharedContact: thread.hasSharedContact,
        }));

        if (isMounted) {
          setRipples(nextRipples);
          setState("ready");
        }
      } catch {
        if (isMounted) {
          setRipples([]);
          setState("error");
        }
      }
    }

    void loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleToggleDecline(matchId: string, declined: boolean, reason?: string) {
    const response = await updateMatchDeclineRequest(matchId, {
      declined,
      reason,
    });

    setRipples((current) =>
      current.map((ripple) =>
        ripple.id === matchId
          ? {
              ...ripple,
              declined: response.declined,
              declineReason: response.declineReason,
              sharedContactType: response.sharedContactType,
              sharedContactValue: response.sharedContactValue,
              hasSharedContact: response.hasSharedContact,
            }
          : ripple,
      ),
    );
  }

  async function handleSaveSharedContact(
    matchId: string,
    type: SharedContactType,
    value: string,
  ) {
    const response = await updateMatchSharedContactRequest(matchId, {
      type,
      value,
    });

    setRipples((current) =>
      current.map((ripple) =>
        ripple.id === matchId
          ? {
              ...ripple,
              declined: response.declined,
              declineReason: response.declineReason,
              sharedContactType: response.sharedContactType,
              sharedContactValue: response.sharedContactValue,
              hasSharedContact: response.hasSharedContact,
            }
          : ripple,
      ),
    );

    if (response.mutualRevealTriggered) {
      window.dispatchEvent(
        new CustomEvent("dashboard-chat:refresh", {
          detail: { routeKind: "match", routeId: matchId },
        }),
      );
    }
  }

  return (
    <PotentialRipplesSection
      isLoading={state === "loading" || state === "idle"}
      onSaveSharedContact={handleSaveSharedContact}
      onToggleDecline={handleToggleDecline}
      ripples={ripples}
    />
  );
}
