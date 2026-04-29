import type { SharedContactType } from "@/lib/supabase/types";

export type RippleCard = {
  id: string;
  label: string;
  match_reason: string | null;
  statusLabel: string | null;
  profilePictureUrl: string | null;
  targetUserId: string;
  declined: boolean;
  declineReason: string | null;
  sharedContactType: SharedContactType | null;
  sharedContactValue: string | null;
  hasSharedContact: boolean;
};
