-- Migration 012: pgvector similarity search RPC function
-- Called via supabase.rpc('search_members', { ... }) from Server Actions.

CREATE OR REPLACE FUNCTION search_members(
  query_embedding vector(1536),
  search_org_id uuid,
  exclude_chapter_ids uuid[],
  geo_filter text[] DEFAULT NULL,
  match_limit int DEFAULT 3
)
RETURNS TABLE (
  member_id uuid,
  company_name text,
  tagline text,
  what_i_do text,
  who_i_serve text,
  geography_served text[],
  match_score float
)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (mp.member_id)
    mp.member_id,
    mp.company_name,
    mp.tagline,
    mp.what_i_do,
    mp.who_i_serve,
    mp.geography_served,
    1 - (mp.embedding <=> query_embedding) AS match_score
  FROM member_profiles mp
  JOIN chapter_memberships cm ON cm.member_id = mp.member_id
  JOIN chapters ch ON ch.id = cm.chapter_id
  WHERE mp.embedding IS NOT NULL
    AND cm.status = 'active'
    AND cm.deleted_at IS NULL
    AND ch.organization_id = search_org_id
    AND NOT (cm.chapter_id = ANY(exclude_chapter_ids))
    AND (geo_filter IS NULL OR mp.geography_served && geo_filter)
    AND 1 - (mp.embedding <=> query_embedding) > 0.3
  ORDER BY mp.member_id, match_score DESC
  LIMIT match_limit;
$$;
