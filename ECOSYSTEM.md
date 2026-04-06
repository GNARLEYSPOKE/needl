# Needl — Domain Model

The authoritative reference for all data entities, relationships, and TypeScript types.
Read this file before modifying any database schema or writing data-access code.
`chapter_memberships` is the load-bearing table. Almost every query joins through it.

---

## Core Entities and TypeScript Types

### Layer 1: Tenancy and Geography

```typescript
type Organization = {
  id: string                        // uuid
  name: string                      // "Corporate Connections Canada"
  slug: string                      // "corporate-connections-ca"
  logo_url: string | null
  profession_exclusivity: boolean   // true = one profession per chapter (BNI). false = CC
  settings: Record<string, unknown> // jsonb: org-level feature flags
  is_active: boolean
  created_at: string
}

type Country = {
  id: string
  organization_id: string
  name: string                      // "Canada"
  iso_code: string                  // "CA" — char(2)
  national_director_id: string | null
}

type Region = {
  id: string
  country_id: string
  name: string                      // "Ontario" | "British Columbia" | "Alberta"
  regional_director_id: string | null
}
```

### Layer 2: Chapters

```typescript
type Chapter = {
  id: string
  organization_id: string
  region_id: string
  name: string                      // "CC Toronto Bay Street"
  meeting_format: 'in_person' | 'virtual' | 'hybrid'
  meeting_day: string               // "Tuesday"
  meeting_time: string              // "07:30"
  timezone: string                  // "America/Toronto"
  max_members: number               // hard cap: 25
  is_active: boolean
  created_at: string
}

// THE load-bearing join table. Almost every meaningful query joins through here.
type ChapterMembership = {
  id: string
  chapter_id: string
  member_id: string
  role: 'member' | 'director' | 'co_director'
  profession_category: string       // normalized vertical: "Legal" | "Technology" | "Real Estate"
  status: 'active' | 'lapsed' | 'suspended' | 'invited' | 'pending' | 'cancelled'
  joined_at: string                 // date
  expires_at: string                // date
  last_renewed_at: string | null    // date
  invited_by_member_id: string | null
  notes: string | null              // admin-only field
  created_at: string
  deleted_at: string | null         // soft delete
}

// INDEXES (non-negotiable — in migration 003):
// CREATE INDEX idx_chapter_memberships_chapter_status ON chapter_memberships(chapter_id, status);
// CREATE INDEX idx_chapter_memberships_member_status ON chapter_memberships(member_id, status);
// UNIQUE (chapter_id, member_id) WHERE deleted_at IS NULL
// UNIQUE (chapter_id, profession_category) enforced by trigger when organization.profession_exclusivity = true
```

### Layer 3: Members and Profiles

```typescript
type Member = {
  id: string                        // matches Clerk user ID
  organization_id: string
  email: string
  phone: string | null
  full_name: string
  avatar_url: string | null
  linkedin_url: string | null
  data_residency: string            // "CA" | "EU" — char(2), PIPEDA/GDPR routing
  is_active: boolean
  last_login_at: string | null
  onboarding_completed_at: string | null
  created_at: string
  deleted_at: string | null         // soft delete
}

type MemberProfile = {
  id: string
  member_id: string                 // UNIQUE — one profile per member
  company_name: string
  company_url: string | null
  tagline: string                   // one sentence, plain language
  bio: string                       // 2-4 paragraphs, AI-assisted draft
  what_i_do: string                 // plain language, no dropdown
  who_i_serve: string               // target client description
  results_i_deliver: string         // outcomes, not features
  clients_served: string[]          // named clients optional; industry categories required
  geography_served: string[]        // ["Canada", "United States"]
  industry_tags: string[]           // AI-extracted from profile text
  linkedin_imported_at: string | null
  embedding: number[] | null        // vector(1536) — OpenAI text-embedding-3-small
  embedding_updated_at: string | null
  profile_completeness: number      // 0-100 integer, drives onboarding nudges
  created_at: string
  updated_at: string
}

// Embedding text = [tagline, bio, what_i_do, who_i_serve, results_i_deliver, clients_served.join(', ')].join('\n')
// HNSW index: CREATE INDEX ON member_profiles USING hnsw (embedding vector_cosine_ops);

type Testimonial = {
  id: string
  author_member_id: string
  recipient_member_id: string
  body: string
  is_visible: boolean               // recipient can hide
  created_at: string
}
// RULE: author and recipient must both be active in the same organization

type NotificationPreferences = {
  id: string
  member_id: string                 // UNIQUE
  email_digest_frequency: 'daily' | 'weekly' | 'never'
  push_enabled: boolean
  sms_enabled: boolean
  match_notifications: boolean
  intro_notifications: boolean
  updated_at: string
}
```

### Layer 4: Asks and Matching

```typescript
type Ask = {
  id: string
  member_id: string
  body: string                      // plain language, no dropdown
  visibility: 'chapter' | 'network'
  geography_filter: string[]        // AI-extracted from body — ["Canada", "Ontario"]
  status: 'active' | 'fulfilled' | 'paused' | 'expired'
  embedding: number[] | null        // vector(1536)
  fulfilled_by_member_id: string | null
  fulfilled_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Match is append-only. No DELETE RLS policy exists on this table. Do not add one.
type Match = {
  id: string
  ask_id: string
  matched_member_id: string
  match_score: number               // cosine similarity 0.0–1.0
  match_reason: string              // AI-generated sentence: "Acme Corp serves mid-market..."
  notified_at: string | null        // when asker was notified
  asker_action: 'pending' | 'intro_requested' | 'dismissed' | 'connected'
  created_at: string
}
```

### Core Matching Query (corrected)

```sql
SELECT
  mp.member_id,
  mp.company_name,
  mp.tagline,
  mp.what_i_do,
  mp.geography_served,
  1 - (mp.embedding <=> a.embedding) AS match_score
FROM member_profiles mp
JOIN chapter_memberships cm ON cm.member_id = mp.member_id
JOIN chapters ch ON ch.id = cm.chapter_id
JOIN asks a ON a.id = $1
WHERE cm.status = 'active'
  AND ch.organization_id = $2
  AND cm.chapter_id != $3          -- exclude requester's chapter
  AND mp.geography_served && $4    -- array overlap with ask.geography_filter
ORDER BY match_score DESC
LIMIT 10;
```

### Layer 5: Introductions

```typescript
type Introduction = {
  id: string
  requester_member_id: string
  target_member_id: string
  connector_member_id: string | null  // null = direct request (no mutual connector)
  ask_id: string | null
  match_id: string | null
  message: string                   // requester's note
  connector_response: 'pending' | 'accepted' | 'declined' | 'suggested_alternative' | null
  connector_note: string | null
  alternative_member_id: string | null  // if connector redirects
  intro_sent_at: string | null
  status: 'pending' | 'completed' | 'declined'
  created_at: string
}

// Connector selection algorithm (application layer, not schema):
// 1. Active chapter_membership in same chapter as target_member, longest tenure (joined_at ASC)
// 2. Highest referral activity: COUNT referrals WHERE created_at > now() - interval '90 days'
// 3. Fallback: connector_member_id = null, direct request to target
```

### Layer 6: Events and Visitors

```typescript
type Event = {
  id: string
  chapter_id: string
  title: string
  format: 'in_person' | 'virtual' | 'hybrid'
  location: string | null           // address or video link
  scheduled_at: string              // timestamptz
  duration_minutes: number
  created_by_member_id: string
  is_cancelled: boolean
  created_at: string
}

type VisitorInvitation = {
  id: string
  event_id: string
  inviting_member_id: string
  visitor_name: string
  visitor_email: string
  visitor_company: string | null
  visitor_role: string | null
  invite_sent_at: string | null
  rsvp_status: 'pending' | 'confirmed' | 'declined'
  attended: boolean
  follow_up_status: 'none' | 'contacted' | 'applied' | 'joined'
  invite_token: string              // uuid — unique RSVP URL token
  created_at: string
}

type EventAttendance = {
  id: string
  event_id: string
  member_id: string
  attended: boolean
  substitute_member_id: string | null  // CC culture: send a sub if you can't attend
  created_at: string
}
```

### Layer 7: Referrals

```typescript
type Referral = {
  id: string
  organization_id: string
  referring_member_id: string
  receiving_member_id: string
  referred_contact_name: string     // the third party being referred
  referred_contact_email: string | null
  notes: string | null
  estimated_value: number | null    // numeric
  currency: string                  // "CAD" | "USD" — char(3)
  status: 'passed' | 'closed' | 'lost'
  closed_at: string | null
  created_at: string
}
```

### Layer 8: Notifications

```typescript
type Notification = {
  id: string
  member_id: string
  type:
    | 'new_match'
    | 'intro_request'
    | 'intro_accepted'
    | 'intro_declined'
    | 'new_testimonial'
    | 'ask_fulfilled'
    | 'ask_no_matches_nudge'
    | 'visitor_rsvp'
    | 'membership_expiring'
    | 'new_member'
    | 'onboarding_nudge'
    | 'chapter_limit_warning'
  title: string
  body: string
  related_entity_type: 'ask' | 'introduction' | 'event' | 'member' | 'chapter' | null
  related_entity_id: string | null
  is_read: boolean
  read_at: string | null
  delivery_channel: 'in_app' | 'push' | 'email'
  created_at: string
}
```

### Layer 9: Forum Privacy Wall (schema stub only — no UI in v1)

```typescript
// HARD RULE: No table in Layers 1-8 references forums or forum_memberships.
// Forum context is invisible to all network queries.
// RLS enforces this at the database level.

type Forum = {
  id: string
  organization_id: string
  chapter_id: string | null
  name: string
  facilitator_member_id: string
  is_active: boolean
  created_at: string
}

type ForumMembership = {
  id: string
  forum_id: string
  member_id: string
  role: 'member' | 'facilitator'
  joined_at: string
  status: 'active' | 'inactive'
  created_at: string
}
// RLS: SELECT only where auth.uid() has active forum_membership for this forum_id
```

---

## Engagement Scoring (Materialized View)

```sql
-- member_engagement_scores — refreshed weekly via cron Edge Function
-- Never stored as rows; computed on schedule

-- Inputs (last 90 days per member per chapter):
--   event_attendances.attended = true
--   asks.created_at (active asks)
--   referrals.created_at (any status)
--   introductions made or accepted
--   member_profiles.profile_completeness
--   members.last_login_at recency

-- Output: engagement_score integer 0-100
-- Flag: is_at_risk = true when engagement_score < 30
--       AND chapter_memberships.expires_at < now() + interval '90 days'
```

---

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| organizations | own org only | never (admin only) | network_admin | never |
| countries | own org | never | network_admin | never |
| regions | own org | never | network_admin | never |
| chapters | own org | network_admin | network_admin/director | never |
| chapter_memberships | own org, own chapters | director/admin | director/admin | soft delete only |
| members | own org | clerk webhook only | own record + admin | soft delete only |
| member_profiles | own org (summary cross-chapter) | own record | own record | never |
| asks | chapter/network based on visibility | own record | own record | own record |
| matches | own asks only | edge function only | edge function only | never |
| introductions | involved parties only | member | involved parties | never |
| referrals | own org, own chapter | member | own record | never |
| notifications | own member_id | system only | own member_id (is_read) | never |
| forums | own forum_membership | never | facilitator | never |
| forum_memberships | own record | facilitator | facilitator | never |

---

## Cross-Chapter Profile Visibility Rules

Members can see other chapters' members:
- company_name, tagline, what_i_do, who_i_serve, geography_served, standing asks

Members cannot see other chapters' members:
- email, phone, referral history, membership status, full testimonials, last_login_at

Action available cross-chapter: warm intro request only. No cold contact.

---

## Key Enum Definitions

```typescript
type MemberRole = 'member' | 'director' | 'co_director'
type MembershipStatus = 'active' | 'lapsed' | 'suspended' | 'invited' | 'pending' | 'cancelled'
type AskStatus = 'active' | 'fulfilled' | 'paused' | 'expired'
type AskVisibility = 'chapter' | 'network'
type AskerAction = 'pending' | 'intro_requested' | 'dismissed' | 'connected'
type ConnectorResponse = 'pending' | 'accepted' | 'declined' | 'suggested_alternative'
type IntroductionStatus = 'pending' | 'completed' | 'declined'
type MeetingFormat = 'in_person' | 'virtual' | 'hybrid'
type RsvpStatus = 'pending' | 'confirmed' | 'declined'
type FollowUpStatus = 'none' | 'contacted' | 'applied' | 'joined'
type ReferralStatus = 'passed' | 'closed' | 'lost'
type DeliveryChannel = 'in_app' | 'push' | 'email'
type AppRole = 'super_admin' | 'network_admin' | 'region_admin' | 'chapter_director' | 'member' | 'visitor'
```
