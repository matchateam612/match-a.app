"use client";

import { useEffect, useState } from "react";

import { listMatchedProfilePicturesRequest } from "@/lib/pictures/picture-api";
import { getCurrentUser } from "@/lib/supabase/auth";
import { listMatchesForUser } from "@/lib/supabase/matches";

import { mapMatchesToRippleCards } from "../_lib/ripple-mappers";
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
        const user = await getCurrentUser();

        if (!user) {
          if (isMounted) {
            setRipples([]);
            setState("ready");
          }

          return;
        }

        const nextMatches = await listMatchesForUser(user.id);
        const nextRipples = mapMatchesToRippleCards(nextMatches, user.id);
        const picturesResponse =
          nextMatches.length > 0
            ? await listMatchedProfilePicturesRequest(nextMatches.map((match) => match.id))
            : { pictures: [] };
        const picturesByMatchId = new Map(
          picturesResponse.pictures.map((picture) => [picture.matchId, picture.signedUrl]),
        );
        const ripplesWithPictures = nextRipples.map((ripple) => ({
          ...ripple,
          profilePictureUrl: picturesByMatchId.get(ripple.id) ?? null,
        }));

        if (isMounted) {
          setRipples(ripplesWithPictures);
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

  return (
    <PotentialRipplesSection
      isLoading={state === "loading" || state === "idle"}
      ripples={ripples}
    />
  );
}
