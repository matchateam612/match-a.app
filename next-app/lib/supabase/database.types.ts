import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import type {
  EthnicityOption,
  GenderIdentityOption,
  InterestedInOption,
  PreferredEthnicityOption,
} from "@/app/onboarding/1-basics/_components/basic-info-types";
import type { RelationshipIntent } from "@/app/onboarding/2-mentality/_components/mentality-types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      user_basic_info: {
        Row: {
          user_id: string;
          age: number | null;
          phone_number: string | null;
          preferred_age_min: number | null;
          preferred_age_max: number | null;
          gender_identity: GenderIdentityOption | null;
          gender_identity_custom: string | null;
          interested_in: InterestedInOption | null;
          interested_in_custom: string | null;
          ethnicity: EthnicityOption | null;
          preferred_ethnicities: PreferredEthnicityOption[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          age?: number | null;
          phone_number?: string | null;
          preferred_age_min?: number | null;
          preferred_age_max?: number | null;
          gender_identity?: GenderIdentityOption | null;
          gender_identity_custom?: string | null;
          interested_in?: InterestedInOption | null;
          interested_in_custom?: string | null;
          ethnicity?: EthnicityOption | null;
          preferred_ethnicities?: PreferredEthnicityOption[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          age?: number | null;
          phone_number?: string | null;
          preferred_age_min?: number | null;
          preferred_age_max?: number | null;
          gender_identity?: GenderIdentityOption | null;
          gender_identity_custom?: string | null;
          interested_in?: InterestedInOption | null;
          interested_in_custom?: string | null;
          ethnicity?: EthnicityOption | null;
          preferred_ethnicities?: PreferredEthnicityOption[];
          updated_at?: string;
        };
        Relationships: [];
      };
      user_agent_profile: {
        Row: {
          user_id: string;
          criteria: Json;
          final_summary: string | null;
          agent_memory: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          criteria?: Json;
          final_summary?: string | null;
          agent_memory?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          criteria?: Json;
          final_summary?: string | null;
          agent_memory?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_mentality: {
        Row: {
          user_id: string;
          relationship_intent: RelationshipIntent | null;
          selected_track: RelationshipIntent | null;
          answers: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          relationship_intent?: RelationshipIntent | null;
          selected_track?: RelationshipIntent | null;
          answers?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          relationship_intent?: RelationshipIntent | null;
          selected_track?: RelationshipIntent | null;
          answers?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_matches_info: {
        Row: {
          user_id: string;
          age: number | null;
          gender_identity: GenderIdentityOption | null;
          interested_in: InterestedInOption | null;
          ethnicity: EthnicityOption | null;
          relationship_intent: RelationshipIntent | null;
          mentality_summary: string | null;
          agent_summary: string | null;
          profile_picture_path: string | null;
          visible_payload: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          age?: number | null;
          gender_identity?: GenderIdentityOption | null;
          interested_in?: InterestedInOption | null;
          ethnicity?: EthnicityOption | null;
          relationship_intent?: RelationshipIntent | null;
          mentality_summary?: string | null;
          agent_summary?: string | null;
          profile_picture_path?: string | null;
          visible_payload?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          age?: number | null;
          gender_identity?: GenderIdentityOption | null;
          interested_in?: InterestedInOption | null;
          ethnicity?: EthnicityOption | null;
          relationship_intent?: RelationshipIntent | null;
          mentality_summary?: string | null;
          agent_summary?: string | null;
          profile_picture_path?: string | null;
          visible_payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
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
