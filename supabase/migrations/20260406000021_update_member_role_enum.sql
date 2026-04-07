-- Migration 021: Update member_role enum
-- Remove co_director, add network_admin
-- network_admin = franchise owner with cross-chapter access

-- Rename any existing co_director to director
UPDATE chapter_memberships SET role = 'director' WHERE role = 'co_director';

-- Postgres doesn't support DROP VALUE from enum, so recreate
ALTER TYPE member_role RENAME TO member_role_old;

CREATE TYPE member_role AS ENUM ('member', 'director', 'network_admin');

ALTER TABLE chapter_memberships
  ALTER COLUMN role TYPE member_role
  USING role::text::member_role;

DROP TYPE member_role_old;
