export type RippleCard = {
  id: string;
  label: string;
  match_reason: string | null;
  statusLabel: string | null;
  profilePictureUrl: string | null;
  targetUserId: string;
  userIds: [string, string];
};
