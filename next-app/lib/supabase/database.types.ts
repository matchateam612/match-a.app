import type { UserInfo } from "@/app/onboarding/_shared/user-info-types";
import type {
  EthnicityOption,
  GenderIdentityOption,
  InterestedInOption,
  PreferredEthnicityOption,
} from "@/app/onboarding/1-basics/_components/basic-info-types";
import type { RelationshipIntent } from "@/app/onboarding/2-mentality/_components/mentality-types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OnboardingStatus =
  | "1-basics"
  | "2-mentality"
  | "3-picture"
  | "4-agent"
  | "finished";

export type UserTier = "free" | "paid";

export type Database = {
  public: {
    Tables: {
      matches: {
        Row: {
          id: string;
          user1: string;
          user2: string;
          match_reason: string | null;
          user1_match_status: 0 | 1;
          user2_match_status: 0 | 1;
        };
        Insert: {
          id?: string;
          user1: string;
          user2: string;
          match_reason?: string | null;
          user1_match_status?: 0 | 1;
          user2_match_status?: 0 | 1;
        };
        Update: {
          id?: string;
          user1?: string;
          user2?: string;
          match_reason?: string | null;
          user1_match_status?: 0 | 1;
          user2_match_status?: 0 | 1;
        };
        Relationships: [];
      };
      match_user_actions: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          declined: boolean;
          decline_reason: string | null;
          shared_contact_type: "phone" | "whatsapp" | "instagram" | "wechat" | null;
          shared_contact_value: string | null;
          contact_shared_at: string | null;
          contact_revealed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id: string;
          declined?: boolean;
          decline_reason?: string | null;
          shared_contact_type?: "phone" | "whatsapp" | "instagram" | "wechat" | null;
          shared_contact_value?: string | null;
          contact_shared_at?: string | null;
          contact_revealed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          user_id?: string;
          declined?: boolean;
          decline_reason?: string | null;
          shared_contact_type?: "phone" | "whatsapp" | "instagram" | "wechat" | null;
          shared_contact_value?: string | null;
          contact_shared_at?: string | null;
          contact_revealed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_memories: {
        Row: {
          id: string;
          user_id: string;
          source_thread_id: string | null;
          source_message_id: string | null;
          kind: string;
          content: string;
          confidence: number | null;
          status: string;
          created_at: string;
          updated_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_thread_id?: string | null;
          source_message_id?: string | null;
          kind: string;
          content: string;
          confidence?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_thread_id?: string | null;
          source_message_id?: string | null;
          kind?: string;
          content?: string;
          confidence?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      agent_messages: {
        Row: {
          id: string;
          thread_id: string;
          user_id: string;
          role: string;
          content: string;
          status: string;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          role: string;
          content: string;
          status?: string;
          created_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          thread_id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          status?: string;
          created_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      agent_threads: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          match_id: string | null;
          title: string | null;
          latest_message_preview: string | null;
          created_at: string;
          updated_at: string;
          last_message_at: string | null;
          archived_at: string | null;
          summary: string | null;
          summary_updated_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          match_id?: string | null;
          title?: string | null;
          latest_message_preview?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
          archived_at?: string | null;
          summary?: string | null;
          summary_updated_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          match_id?: string | null;
          title?: string | null;
          latest_message_preview?: string | null;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
          archived_at?: string | null;
          summary?: string | null;
          summary_updated_at?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
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
      user_system_state: {
        Row: {
          user_id: string;
          onboarding_status: OnboardingStatus;
          tier: UserTier;
          promoted_by: string | null;
          report_flags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          onboarding_status?: OnboardingStatus;
          tier?: UserTier;
          promoted_by?: string | null;
          report_flags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          onboarding_status?: OnboardingStatus;
          tier?: UserTier;
          promoted_by?: string | null;
          report_flags?: string[];
          created_at?: string;
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
