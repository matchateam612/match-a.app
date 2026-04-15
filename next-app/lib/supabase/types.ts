export type MatchStatus = 0 | 1;

export type MatchRecord = {
  id: string;
  user1: string;
  user2: string;
  match_reason: string | null;
  user1_match_status: MatchStatus;
  user2_match_status: MatchStatus;
};

export type EmailPasswordAuthPayload = {
  email: string;
  password: string;
};
