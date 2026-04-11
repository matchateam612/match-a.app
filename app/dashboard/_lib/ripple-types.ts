export type RippleCard = {
  id: string;
  label: string;
  match_reason: string | null;
  statusLabel: string | null;
  userIds: [string, string];
};
