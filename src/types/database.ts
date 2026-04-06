// Manually written to match schema. Will be overwritten by:
// supabase gen types typescript --linked > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          profession_exclusivity: boolean;
          settings: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          profession_exclusivity?: boolean;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          profession_exclusivity?: boolean;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      countries: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          iso_code: string;
          national_director_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          iso_code: string;
          national_director_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          iso_code?: string;
          national_director_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      regions: {
        Row: {
          id: string;
          country_id: string;
          name: string;
          regional_director_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          country_id: string;
          name: string;
          regional_director_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          country_id?: string;
          name?: string;
          regional_director_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          organization_id: string;
          region_id: string;
          name: string;
          meeting_format: Database['public']['Enums']['meeting_format'];
          meeting_day: string;
          meeting_time: string;
          timezone: string;
          max_members: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          region_id: string;
          name: string;
          meeting_format?: Database['public']['Enums']['meeting_format'];
          meeting_day: string;
          meeting_time: string;
          timezone?: string;
          max_members?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          region_id?: string;
          name?: string;
          meeting_format?: Database['public']['Enums']['meeting_format'];
          meeting_day?: string;
          meeting_time?: string;
          timezone?: string;
          max_members?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      chapter_memberships: {
        Row: {
          id: string;
          chapter_id: string;
          member_id: string;
          role: Database['public']['Enums']['member_role'];
          profession_category: string | null;
          status: Database['public']['Enums']['membership_status'];
          joined_at: string;
          expires_at: string;
          last_renewed_at: string | null;
          invited_by_member_id: string | null;
          notes: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          member_id: string;
          role?: Database['public']['Enums']['member_role'];
          profession_category?: string | null;
          status?: Database['public']['Enums']['membership_status'];
          joined_at?: string;
          expires_at: string;
          last_renewed_at?: string | null;
          invited_by_member_id?: string | null;
          notes?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          member_id?: string;
          role?: Database['public']['Enums']['member_role'];
          profession_category?: string;
          status?: Database['public']['Enums']['membership_status'];
          joined_at?: string;
          expires_at?: string;
          last_renewed_at?: string | null;
          invited_by_member_id?: string | null;
          notes?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          organization_id: string;
          clerk_user_id: string | null;
          email: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          linkedin_url: string | null;
          data_residency: string;
          is_active: boolean;
          last_login_at: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string; // Auto-generated uuid
          organization_id: string;
          clerk_user_id?: string | null;
          email: string;
          phone?: string | null;
          full_name: string;
          avatar_url?: string | null;
          linkedin_url?: string | null;
          data_residency: string;
          is_active?: boolean;
          last_login_at?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          clerk_user_id?: string | null;
          email?: string;
          phone?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          linkedin_url?: string | null;
          data_residency?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      member_profiles: {
        Row: {
          id: string;
          member_id: string;
          company_name: string;
          company_url: string | null;
          tagline: string;
          bio: string;
          what_i_do: string;
          who_i_serve: string;
          results_i_deliver: string;
          clients_served: string[];
          geography_served: string[];
          industry_tags: string[];
          linkedin_imported_at: string | null;
          embedding: string | null;
          embedding_updated_at: string | null;
          profile_completeness: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          company_name: string;
          company_url?: string | null;
          tagline: string;
          bio: string;
          what_i_do: string;
          who_i_serve: string;
          results_i_deliver: string;
          clients_served?: string[];
          geography_served?: string[];
          industry_tags?: string[];
          linkedin_imported_at?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          profile_completeness?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          company_name?: string;
          company_url?: string | null;
          tagline?: string;
          bio?: string;
          what_i_do?: string;
          who_i_serve?: string;
          results_i_deliver?: string;
          clients_served?: string[];
          geography_served?: string[];
          industry_tags?: string[];
          linkedin_imported_at?: string | null;
          embedding?: string | null;
          embedding_updated_at?: string | null;
          profile_completeness?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          member_id: string;
          email_digest_frequency: Database['public']['Enums']['email_digest_frequency'];
          push_enabled: boolean;
          sms_enabled: boolean;
          match_notifications: boolean;
          intro_notifications: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          email_digest_frequency?: Database['public']['Enums']['email_digest_frequency'];
          push_enabled?: boolean;
          sms_enabled?: boolean;
          match_notifications?: boolean;
          intro_notifications?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          email_digest_frequency?: Database['public']['Enums']['email_digest_frequency'];
          push_enabled?: boolean;
          sms_enabled?: boolean;
          match_notifications?: boolean;
          intro_notifications?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          author_member_id: string;
          recipient_member_id: string;
          body: string;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_member_id: string;
          recipient_member_id: string;
          body: string;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_member_id?: string;
          recipient_member_id?: string;
          body?: string;
          is_visible?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      forums: {
        Row: {
          id: string;
          organization_id: string;
          chapter_id: string | null;
          name: string;
          facilitator_member_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          chapter_id?: string | null;
          name: string;
          facilitator_member_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          chapter_id?: string | null;
          name?: string;
          facilitator_member_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      forum_memberships: {
        Row: {
          id: string;
          forum_id: string;
          member_id: string;
          role: Database['public']['Enums']['forum_role'];
          joined_at: string;
          status: Database['public']['Enums']['forum_membership_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          forum_id: string;
          member_id: string;
          role?: Database['public']['Enums']['forum_role'];
          joined_at?: string;
          status?: Database['public']['Enums']['forum_membership_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          forum_id?: string;
          member_id?: string;
          role?: Database['public']['Enums']['forum_role'];
          joined_at?: string;
          status?: Database['public']['Enums']['forum_membership_status'];
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_chapter_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      get_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_member_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      search_members: {
        Args: {
          query_embedding: string;
          search_org_id: string;
          exclude_chapter_ids: string[];
          geo_filter?: string[] | null;
          match_limit?: number;
        };
        Returns: {
          member_id: string;
          company_name: string;
          tagline: string;
          what_i_do: string;
          who_i_serve: string;
          geography_served: string[];
          match_score: number;
        }[];
      };
    };
    Enums: {
      meeting_format: 'in_person' | 'virtual' | 'hybrid';
      member_role: 'member' | 'director' | 'co_director';
      membership_status:
        | 'active'
        | 'lapsed'
        | 'suspended'
        | 'invited'
        | 'pending'
        | 'cancelled';
      email_digest_frequency: 'daily' | 'weekly' | 'never';
      forum_role: 'member' | 'facilitator';
      forum_membership_status: 'active' | 'inactive';
    };
    CompositeTypes: Record<string, never>;
  };
}
