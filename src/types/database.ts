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
          billing_status: string;
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
          billing_status?: string;
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
          billing_status?: string;
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
          first_search_at: string | null;
          first_ask_posted_at: string | null;
          first_intro_requested_at: string | null;
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
          first_search_at?: string | null;
          first_ask_posted_at?: string | null;
          first_intro_requested_at?: string | null;
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
          first_search_at?: string | null;
          first_ask_posted_at?: string | null;
          first_intro_requested_at?: string | null;
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
      asks: {
        Row: {
          id: string;
          member_id: string;
          body: string;
          visibility: Database['public']['Enums']['ask_visibility'];
          geography_filter: string[];
          status: Database['public']['Enums']['ask_status'];
          embedding: string | null;
          fulfilled_by_member_id: string | null;
          fulfilled_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          body: string;
          visibility?: Database['public']['Enums']['ask_visibility'];
          geography_filter?: string[];
          status?: Database['public']['Enums']['ask_status'];
          embedding?: string | null;
          fulfilled_by_member_id?: string | null;
          fulfilled_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          body?: string;
          visibility?: Database['public']['Enums']['ask_visibility'];
          geography_filter?: string[];
          status?: Database['public']['Enums']['ask_status'];
          embedding?: string | null;
          fulfilled_by_member_id?: string | null;
          fulfilled_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          ask_id: string;
          matched_member_id: string;
          match_score: number;
          match_reason: string;
          notified_at: string | null;
          asker_action: Database['public']['Enums']['asker_action'];
          created_at: string;
        };
        Insert: {
          id?: string;
          ask_id: string;
          matched_member_id: string;
          match_score: number;
          match_reason: string;
          notified_at?: string | null;
          asker_action?: Database['public']['Enums']['asker_action'];
          created_at?: string;
        };
        Update: {
          id?: string;
          ask_id?: string;
          matched_member_id?: string;
          match_score?: number;
          match_reason?: string;
          notified_at?: string | null;
          asker_action?: Database['public']['Enums']['asker_action'];
          created_at?: string;
        };
        Relationships: [];
      };
      introductions: {
        Row: {
          id: string;
          requester_member_id: string;
          target_member_id: string;
          connector_member_id: string | null;
          ask_id: string | null;
          match_id: string | null;
          message: string;
          connector_response: Database['public']['Enums']['connector_response'] | null;
          connector_note: string | null;
          alternative_member_id: string | null;
          intro_sent_at: string | null;
          status: Database['public']['Enums']['introduction_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_member_id: string;
          target_member_id: string;
          connector_member_id?: string | null;
          ask_id?: string | null;
          match_id?: string | null;
          message: string;
          connector_response?: Database['public']['Enums']['connector_response'] | null;
          connector_note?: string | null;
          alternative_member_id?: string | null;
          intro_sent_at?: string | null;
          status?: Database['public']['Enums']['introduction_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_member_id?: string;
          target_member_id?: string;
          connector_member_id?: string | null;
          ask_id?: string | null;
          match_id?: string | null;
          message?: string;
          connector_response?: Database['public']['Enums']['connector_response'] | null;
          connector_note?: string | null;
          alternative_member_id?: string | null;
          intro_sent_at?: string | null;
          status?: Database['public']['Enums']['introduction_status'];
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          chapter_id: string;
          title: string;
          format: Database['public']['Enums']['meeting_format'];
          location: string | null;
          scheduled_at: string;
          duration_minutes: number;
          created_by_member_id: string;
          is_cancelled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          title: string;
          format?: Database['public']['Enums']['meeting_format'];
          location?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          created_by_member_id: string;
          is_cancelled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          title?: string;
          format?: Database['public']['Enums']['meeting_format'];
          location?: string | null;
          scheduled_at?: string;
          duration_minutes?: number;
          created_by_member_id?: string;
          is_cancelled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      visitor_invitations: {
        Row: {
          id: string;
          event_id: string;
          inviting_member_id: string;
          visitor_name: string;
          visitor_email: string;
          visitor_company: string | null;
          visitor_role: string | null;
          invite_sent_at: string | null;
          rsvp_status: Database['public']['Enums']['rsvp_status'];
          attended: boolean;
          follow_up_status: Database['public']['Enums']['follow_up_status'];
          invite_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          inviting_member_id: string;
          visitor_name: string;
          visitor_email: string;
          visitor_company?: string | null;
          visitor_role?: string | null;
          invite_sent_at?: string | null;
          rsvp_status?: Database['public']['Enums']['rsvp_status'];
          attended?: boolean;
          follow_up_status?: Database['public']['Enums']['follow_up_status'];
          invite_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          inviting_member_id?: string;
          visitor_name?: string;
          visitor_email?: string;
          visitor_company?: string | null;
          visitor_role?: string | null;
          invite_sent_at?: string | null;
          rsvp_status?: Database['public']['Enums']['rsvp_status'];
          attended?: boolean;
          follow_up_status?: Database['public']['Enums']['follow_up_status'];
          invite_token?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      event_attendances: {
        Row: {
          id: string;
          event_id: string;
          member_id: string;
          attended: boolean;
          substitute_member_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          member_id: string;
          attended?: boolean;
          substitute_member_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          member_id?: string;
          attended?: boolean;
          substitute_member_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          organization_id: string;
          referring_member_id: string;
          receiving_member_id: string;
          referred_contact_name: string;
          referred_contact_email: string | null;
          notes: string | null;
          estimated_value: number | null;
          currency: string;
          status: Database['public']['Enums']['referral_status'];
          closed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          referring_member_id: string;
          receiving_member_id: string;
          referred_contact_name: string;
          referred_contact_email?: string | null;
          notes?: string | null;
          estimated_value?: number | null;
          currency?: string;
          status?: Database['public']['Enums']['referral_status'];
          closed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          referring_member_id?: string;
          receiving_member_id?: string;
          referred_contact_name?: string;
          referred_contact_email?: string | null;
          notes?: string | null;
          estimated_value?: number | null;
          currency?: string;
          status?: Database['public']['Enums']['referral_status'];
          closed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          member_id: string;
          type: string;
          title: string;
          body: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          is_read: boolean;
          read_at: string | null;
          delivery_channel: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          type: string;
          title: string;
          body: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          delivery_channel?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          type?: string;
          title?: string;
          body?: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          delivery_channel?: string;
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
      refresh_engagement_scores: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      refresh_engagement_scores_if_stale: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      meeting_format: 'in_person' | 'virtual' | 'hybrid';
      member_role: 'member' | 'director' | 'network_admin';
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
      ask_visibility: 'chapter' | 'network';
      ask_status: 'active' | 'fulfilled' | 'paused' | 'expired';
      asker_action: 'pending' | 'intro_requested' | 'dismissed' | 'connected';
      connector_response: 'pending' | 'accepted' | 'declined' | 'suggested_alternative';
      introduction_status:
        | 'pending_connector'
        | 'pending_target'
        | 'connector_accepted'
        | 'connector_declined'
        | 'completed'
        | 'declined'
        | 'expired';
      rsvp_status: 'pending' | 'confirmed' | 'declined';
      follow_up_status: 'none' | 'contacted' | 'applied' | 'joined';
      referral_status: 'passed' | 'closed' | 'lost';
    };
    CompositeTypes: Record<string, never>;
  };
}
