-- Migration 013: Asks table (Layer 4: Standing Asks)

CREATE TYPE ask_visibility AS ENUM ('chapter', 'network');
CREATE TYPE ask_status AS ENUM ('active', 'fulfilled', 'paused', 'expired');

CREATE TABLE asks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES members(id),
  body text NOT NULL,
  visibility ask_visibility NOT NULL DEFAULT 'network',
  geography_filter text[] NOT NULL DEFAULT '{}',
  status ask_status NOT NULL DEFAULT 'active',
  embedding vector(1536),
  fulfilled_by_member_id uuid REFERENCES members(id),
  fulfilled_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asks_member_id ON asks(member_id);
CREATE INDEX idx_asks_status ON asks(status);
CREATE INDEX idx_asks_embedding ON asks USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER trg_asks_updated_at
  BEFORE UPDATE ON asks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE asks ENABLE ROW LEVEL SECURITY;

-- SELECT: network-visible asks readable by same org; chapter-visible by same chapter
CREATE POLICY "Read asks by visibility"
  ON asks FOR SELECT
  USING (
    (visibility = 'network' AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = asks.member_id
        AND m.organization_id = public.get_organization_id()
    ))
    OR (visibility = 'chapter' AND EXISTS (
      SELECT 1 FROM chapter_memberships cm
      WHERE cm.member_id = asks.member_id
        AND cm.status = 'active'
        AND cm.deleted_at IS NULL
        AND cm.chapter_id = ANY(public.get_chapter_ids())
    ))
    OR member_id = public.get_member_id()
  );

CREATE POLICY "Insert own asks"
  ON asks FOR INSERT
  WITH CHECK (member_id = public.get_member_id());

CREATE POLICY "Update own asks"
  ON asks FOR UPDATE
  USING (member_id = public.get_member_id());

CREATE POLICY "Delete own asks"
  ON asks FOR DELETE
  USING (member_id = public.get_member_id());
