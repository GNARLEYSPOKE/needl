-- Migration 000: Enable pgvector extension and create auth helper functions
-- These must exist before any RLS policy or vector column is created.

-- pgvector for embedding similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Auth helper functions for RLS policies
-- Extract organization_id from Clerk JWT claims
CREATE OR REPLACE FUNCTION auth.organization_id() RETURNS uuid AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json ->> 'organization_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

-- Extract chapter_ids array from Clerk JWT claims
CREATE OR REPLACE FUNCTION auth.chapter_ids() RETURNS uuid[] AS $$
  SELECT COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(
      (current_setting('request.jwt.claims', true)::jsonb -> 'chapter_ids')
    )::uuid),
    ARRAY[]::uuid[]
  );
$$ LANGUAGE sql STABLE;

-- Extract role from Clerk JWT claims
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'role',
    'member'
  );
$$ LANGUAGE sql STABLE;
