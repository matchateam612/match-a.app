"use client";

import { useEffect, useState } from "react";

import { getCurrentUser } from "@/lib/supabase/auth";
import { listMatchesForUser } from "@/lib/supabase/matches";
import type { MatchRecord } from "@/lib/supabase/types";

import { mapMatchesToRippleCards } from "../_lib/ripple-mappers";
import { PotentialRipplesSection } from "./potential-ripples-section";

type LoadState = "idle" | "loading" | "ready" | "error";

export function PotentialRipplesContainer() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [state, setState] = useState<LoadState>("idle");

  useEffect(() => {
    let isMounted = true;

    async function loadMatches() {
      setState("loading");

      try {
        const user = await getCurrentUser();

        if (!user) {
          if (isMounted) {
            setMatches([]);
            setState("ready");
          }

          return;
        }

        const nextMatches = await listMatchesForUser(user.id);

        if (isMounted) {
          setMatches(nextMatches);
          setState("ready");
        }
      } catch {
        if (isMounted) {
          setMatches([]);
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
      ripples={mapMatchesToRippleCards(matches)}
    />
  );
}
