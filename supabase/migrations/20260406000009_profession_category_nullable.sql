-- Migration 009: Make profession_category nullable on chapter_memberships
-- A new member can't have a profession category before completing onboarding.
-- The profession exclusivity trigger already checks status = 'active',
-- so null profession_category on invited/pending members is safe.

ALTER TABLE chapter_memberships ALTER COLUMN profession_category DROP NOT NULL;
