# Needl — API Contracts

## Conventions

- Server Actions for all mutations (profile saves, ask creation, intro requests, referral logging)
- Route Handlers only for: Clerk webhooks, Stripe webhooks, visitor RSVP (unauthenticated)
- All Server Action responses: `{ data: T | null; error: string | null }`
- Authentication validated in every Server Action before anything else
- Authorization (role check) validated after authentication
- Input validation via Zod schema — schema defined once, shared with client
- Never throw from a Server Action — return structured errors

## Standard Server Action Pattern

```typescript
// src/lib/actions/[feature].ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CreateAskSchema = z.object({
  body: z.string().min(20).max(500),
  visibility: z.enum(['chapter', 'network']),
})

export async function createAsk(
  input: z.infer<typeof CreateAskSchema>
): Promise<{ data: { id: string } | null; error: string | null }> {
  // 1. Validate session
  const { userId, sessionClaims } = await auth()
  if (!userId) return { data: null, error: 'Unauthorized' }

  // 2. Validate input
  const parsed = CreateAskSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.message }

  // 3. Check authorization (role if needed)
  const organizationId = sessionClaims?.organization_id as string

  // 4. Execute
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('asks')
    .insert({ ...parsed.data, member_id: userId, organization_id: organizationId })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: { id: data.id }, error: null }
}
```

## Webhook Endpoints

| Route | Provider | Events Handled |
|-------|----------|----------------|
| /api/webhooks/clerk | Clerk | user.created, user.updated — member upsert |
| /api/webhooks/stripe | Stripe | invoice.paid, invoice.payment_failed, customer.subscription.deleted |
| /api/invitations/[token] | None (public) | Visitor RSVP — no auth required |

### Clerk Webhook Handler

```typescript
// /api/webhooks/clerk/route.ts
// Validate Svix signature before processing any event
// user.created: upsert member record, set data_residency based on country
// user.updated: sync full_name, avatar_url, email
// Always return 200 — Clerk retries on non-200
```

### Stripe Webhook Handler

```typescript
// /api/webhooks/stripe/route.ts
// Validate Stripe signature: stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
// invoice.paid: UPDATE chapters SET billing_status = 'active' WHERE stripe_subscription_id = $1
// invoice.payment_failed: INSERT notification (type: billing_failure) to network_admin
// customer.subscription.deleted: UPDATE chapters SET is_active = false
// Always return 200 after processing — Stripe retries on non-200
```

## Key Server Actions

### Profile

```typescript
// Save and trigger async embedding pipeline
saveProfile(input: UpdateProfileInput): Promise<ActionResult<{ profile_completeness: number }>>

// AI-draft profile from LinkedIn data (called on first LinkedIn sign-in)
draftProfileFromLinkedIn(linkedInData: LinkedInProfile): Promise<ActionResult<ProfileDraft>>
```

### Asks

```typescript
// Create ask, trigger async embedding + match pipeline
createAsk(input: CreateAskInput): Promise<ActionResult<{ id: string }>>

// Close ask manually
closeAsk(askId: string): Promise<ActionResult<void>>

// Mark ask as fulfilled
fulfillAsk(askId: string, fulfilledByMemberId: string): Promise<ActionResult<void>>
```

### Search

```typescript
// Natural language search — calls EmbeddingService + pgvector similarity
searchMembers(query: string, countryFilter?: string): Promise<ActionResult<MatchResult[]>>

type MatchResult = {
  member_id: string
  company_name: string
  tagline: string
  what_i_do: string
  geography_served: string[]
  match_score: number
  match_reason: string  // AI-generated sentence
}
```

### Introductions

```typescript
// Create intro request — runs connector selection algorithm
requestIntroduction(input: IntroRequestInput): Promise<ActionResult<{ id: string }>>

// Connector responds
respondToIntroRequest(
  introId: string,
  response: 'accepted' | 'declined' | 'suggested_alternative',
  note?: string,
  alternativeMemberId?: string
): Promise<ActionResult<void>>
```

### Referrals

```typescript
// Log a referral (20-second mobile flow)
logReferral(input: LogReferralInput): Promise<ActionResult<{ id: string }>>

// Update referral status (closed with value, or lost)
updateReferralStatus(
  referralId: string,
  status: 'closed' | 'lost',
  closedValue?: number
): Promise<ActionResult<void>>
```

### Chapter Management (Director only)

```typescript
// Toggle member active/inactive status
setMemberStatus(
  membershipId: string,
  status: 'active' | 'suspended'
): Promise<ActionResult<void>>

// Create visitor invitation with unique token
createVisitorInvitation(input: CreateInvitationInput): Promise<ActionResult<{ invite_token: string }>>

// Update visitor follow-up status
updateVisitorStatus(
  invitationId: string,
  status: FollowUpStatus
): Promise<ActionResult<void>>

// Create chapter meeting event
createEvent(input: CreateEventInput): Promise<ActionResult<{ id: string }>>
```

### Network Admin only

```typescript
// Onboard new chapter (also creates Stripe subscription)
createChapter(input: CreateChapterInput): Promise<ActionResult<{ id: string }>>

// Export member data (PIPEDA-compliant CSV)
exportChapterMembers(chapterId: string): Promise<ActionResult<{ csv: string }>>
```

## Edge Function Contracts

Edge Functions are not Server Actions — they are triggered by database webhooks.
They use the service_role key and are not callable from the browser.

### embed-profile (triggers on member_profiles INSERT or UPDATE)
```typescript
// Input: member_id from webhook payload
// Process: fetch profile text fields, call EmbeddingService.embed(), write back embedding
// Output: UPDATE member_profiles SET embedding = $1, embedding_updated_at = now()
// Retry: Supabase webhook retries up to 3 times on failure
```

### embed-ask (triggers on asks INSERT or UPDATE)
```typescript
// Input: ask_id from webhook payload
// Process: embed ask body, run similarity search, insert top 3 matches, notify asker
// Output: UPDATE asks SET embedding = $1; INSERT INTO matches; INSERT INTO notifications
```

### score-engagement (cron — runs weekly Sunday midnight)
```typescript
// Process: compute engagement_score for all active members
// Refresh: member_engagement_scores materialized view
// Flag: is_at_risk members → INSERT notifications for chapter directors
```

### nudge-stale-asks (cron — runs daily 9am)
```typescript
// Query: active asks with created_at > 30 days ago AND zero matches
// Process: AIService.generateAskNudge(ask) for each
// Output: INSERT notifications (type: ask_no_matches_nudge)
```

### nudge-onboarding (cron — runs daily 10am)
```typescript
// Query: members WHERE onboarding_completed_at IS NULL
//        AND created_at < now() - interval '7 days'
// Output: INSERT notifications (type: onboarding_nudge)
//         NotificationService.sendOnboardingNudge(member)
```
