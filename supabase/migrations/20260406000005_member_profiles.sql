-- Migration 005: Member Profiles (Layer 3) with vector embeddings

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE member_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL UNIQUE REFERENCES members(id),
  company_name text NOT NULL,
  company_url text,
  tagline text NOT NULL,
  bio text NOT NULL,
  what_i_do text NOT NULL,
  who_i_serve text NOT NULL,
  results_i_deliver text NOT NULL,
  clients_served text[] NOT NULL DEFAULT '{}',
  geography_served text[] NOT NULL DEFAULT '{}',
  industry_tags text[] NOT NULL DEFAULT '{}',
  linkedin_imported_at timestamptz,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  embedding_updated_at timestamptz,
  profile_completeness integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HNSW index for cosine similarity search (critical for search performance)
CREATE INDEX idx_member_profiles_embedding
  ON member_profiles USING hnsw (embedding vector_cosine_ops);

-- Auto-update updated_at on every UPDATE
CREATE TRIGGER trg_member_profiles_updated_at
  BEFORE UPDATE ON member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS POLICIES
-- Row-level: same-org members can read all profiles.
-- Column-level cross-chapter restriction is enforced in the application layer
-- (Server Components/Actions project only summary columns for cross-chapter views).
-- ============================================================================

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select profiles in own org"
  ON member_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_profiles.member_id
        AND m.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "Insert own profile"
  ON member_profiles FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Update own profile"
  ON member_profiles FOR UPDATE
  USING (member_id = auth.uid());

CREATE POLICY "No delete"
  ON member_profiles FOR DELETE
  USING (false);
