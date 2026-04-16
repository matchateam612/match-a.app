import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      user_private_info: {
        Row: {
          id: string;
          info: UserInfo | null;
        };
        Insert: {
          id: string;
          info?: UserInfo | null;
        };
        Update: {
          id?: string;
          info?: UserInfo | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
