-- Migration 000: Enable pgvector extension and create auth helper functions
-- These must exist before any RLS policy or vector column is created.
-- Functions are in public schema (auth schema is restricted on Supabase free tier).

-- pgvector for embedding similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Auth helper functions for RLS policies
-- Extract organization_id from Clerk JWT claims
CREATE OR REPLACE FUNCTION public.get_organization_id() RETURNS uuid AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'organization_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- Extract chapter_ids array from Clerk JWT claims
CREATE OR REPLACE FUNCTION public.get_chapter_ids() RETURNS uuid[] AS $$
  SELECT COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(
      (current_setting('request.jwt.claims', true)::jsonb -> 'chapter_ids')
    )::uuid),
    ARRAY[]::uuid[]
  );
$$ LANGUAGE sql STABLE;

-- Extract app-level role from Clerk JWT claims
-- The JWT "role" claim is reserved for Supabase/PostgREST ("authenticated").
-- The app-level role (network_admin, member, etc.) is in "user_role".
CREATE OR REPLACE FUNCTION public.get_role() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'user_role',
    'member'
  );
$$ LANGUAGE sql STABLE;
