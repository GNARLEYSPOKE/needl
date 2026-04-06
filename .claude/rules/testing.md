---
paths:
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "src/__tests__/**/*"
---

# Testing Conventions

## Test Strategy
- Unit tests: pure functions, service adapters, utility helpers
- Integration tests: Server Actions against local Supabase test instance
- E2E tests: critical user flows only — auth, profile save + embedding, search, intro request

## Test File Location
- Unit tests: co-located with the file (`member-card.test.tsx` next to `member-card.tsx`)
- Integration tests: `src/__tests__/[feature]/`
- E2E tests: `e2e/[flow].spec.ts`

## Critical Paths to Test (Always)

### RLS Audit Tests (run before every production deployment)
- Member A cannot SELECT any row from member B's organization
- Cross-chapter member can see summary profile fields only (not email, phone, status)
- Chapter Director cannot access chapter_memberships from another chapter
- matches table has no DELETE capability for any role
- Forum tables are inaccessible from non-forum RLS contexts

### Embedding Pipeline Tests
- Saving a member profile triggers embedding_updated_at update within 10 seconds
- Saving an ask triggers match generation within 10 seconds
- Search returns results ordered by match_score DESC
- Search never returns members from a different organization

### Introduction Flow Tests
- Connector selection returns a member from the target's chapter
- When no connector exists, direct request is created (connector_member_id = null)
- Status transitions are valid (pending → completed, pending → declined only)

### Chapter Limit Tests
- Inserting a 24th active member triggers a chapter_limit_warning notification
- Inserting a 26th active member returns an error and does not insert

## Data Factories
- Never hardcode test data inline in test files
- Create factory functions in `src/__tests__/factories/`
- Use realistic data: real company names, real-sounding bios, real geographies
- Factories: `createMember()`, `createChapter()`, `createAsk()`, `createMembership()`

## Supabase Testing
- Use local Supabase (`supabase start`) for all integration tests
- Reset state between test suites: `supabase db reset`
- Never run integration tests against staging or production databases
- Test RLS explicitly by switching the JWT user context between assertions

## Coverage Requirements
- Server Actions: 80% line coverage minimum
- Service adapters (NotificationService, EmbeddingService, etc.): 90% minimum
- UI components: happy path + error state + loading state

## Prohibitions
- No `console.log` in test files
- No `test.skip` in CI (allowed locally with a tracking issue reference in the comment)
- Do not mock Supabase — use the local test database
- Do not mock the EmbeddingService in integration tests — use a fixed test vector
