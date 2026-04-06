# Needl — UI System Reference

## Design Principles

1. **Mobile-first, always.** Every screen is designed for 375px first. The target user is
   a $5M+ revenue executive checking Needl between meetings on their phone. Desktop is a
   nice-to-have, not the primary surface.

2. **Speed over richness.** A search result in 30 seconds beats a beautiful result in 3
   minutes. Loading states are not optional — they are the product experience between
   actions.

3. **Trust through restraint.** CC members are sophisticated executives. The UI should feel
   like a premium tool, not a consumer app. No gamification, no confetti, no badges.
   Recognition comes from peer testimonials and referral data.

4. **Every screen has one primary action.** The member should always know what to do next.
   One CTA per screen. Hierarchy is enforced through size and weight, not color noise.

5. **Warm, not transactional.** The product is about human connection. Copy is
   conversational and direct. Never "Submit Request" — always "Request Introduction."

## Component Library

**Base:** ShadCN UI (do not modify files in src/components/ui/ directly — ever)
**Custom components:** src/components/[feature]/

When building custom components:
1. Check if ShadCN has it first
2. If building custom, compose from ShadCN primitives
3. Every interactive component needs a loading state (use ShadCN Skeleton)
4. Every data-fetching component needs an error state
5. Keyboard navigation and ARIA labels on all interactive elements

## Naming Conventions

- Components: PascalCase (`MemberCard`, `AskBoard`, `MatchResult`)
- Files: kebab-case (`member-card.tsx`, `ask-board.tsx`, `match-result.tsx`)
- Named exports only. No default exports.
- Co-locate tests: `member-card.test.tsx` next to `member-card.tsx`

## Layout Patterns

**Authenticated app shell:**
- Mobile: bottom navigation bar (Dashboard, Search, Asks, Chapter, Profile)
- Desktop: left sidebar (same items), content area fills remaining width
- No top navigation bar on mobile — too much vertical space consumed

**Page pattern:**
- Page header: title + primary action button (right-aligned)
- Content: full-width cards on mobile, max-w-2xl centered on desktop
- No nested sidebars — flat hierarchy only

**Card pattern (member profile, match result):**
- Avatar + name + company + tagline on one line
- What I do: 1-2 sentences max
- Geography served: tag pills
- Primary action: full-width button at card bottom on mobile

## Color and Typography

Tailwind CSS 4 CSS variables — do not hardcode hex values:

```css
/* Brand */
--color-primary: use Tailwind slate-900 for primary actions
--color-accent: use Tailwind blue-600 for links and interactive states
--color-success: use Tailwind green-600 for completed states
--color-warning: use Tailwind amber-500 for at-risk flags
--color-destructive: use Tailwind red-600 for errors and declines

/* Surfaces */
--color-background: white (light) / slate-950 (dark)
--color-card: white (light) / slate-900 (dark)
--color-muted: slate-100 (light) / slate-800 (dark)
```

**Typography:**
- Font: system font stack (no external font loading — performance on mobile)
- Headings: font-semibold, not font-bold (less aggressive for this audience)
- Body: text-sm on mobile, text-base on desktop
- Member names: always font-medium, never all-caps

## Key Screen Patterns

### Search Screen (`/search`)
```
[Search input — full width, large, prominent]
[Country filter — inline chips below input]

[Results — when query submitted]
  [MatchResultCard × 3 max]
    [Member avatar + name + company]
    [Tagline — 1 line]
    [Match reason — 1 sentence, italicized]
    [Match score — visual confidence bar, not a number]
    [Button: "Request Introduction" — full width on mobile]

[No results state]
  [Illustration + "No matches found in [country]. Try broadening your search."]
```

### Standing Ask Screen (`/asks/new`)
```
[Large textarea: "What do you need? Write it in plain language."]
[Visibility toggle: My Chapter / Global Network]
[Geography: AI-extracted, shown as editable chips below textarea]
[Button: "Post Ask" — full width]
```

### Match Notification (push + email)
```
Subject: "Needl found a match for your Ask"
Body: "[Company name] in [city] may be exactly who you're looking for."
      "[Match reason — one sentence]"
      [CTA button: "View Match"]
```

### Introduction Request Flow (mobile)
```
Screen 1: Target member profile (summary)
  [Avatar, name, company, what I do]
  [Button: "Request Introduction"]

Screen 2: Write your note
  [Textarea: "Add a note for [connector name]"]
  [Who's connecting you: "[Connector] will make this intro"]
  [Button: "Send Request"]

Screen 3: Confirmation
  [Check icon]
  ["Request sent to [connector]. You'll hear back soon."]
  [Button: "Back to Search"]
```

## Form Patterns

- React Hook Form + Zod for all forms
- Zod schema defined once, shared between client validation and Server Action
- Error messages appear inline below the field, never in a toast
- Success confirmations appear in a toast (non-blocking, 3 seconds)
- Server Actions return `{ data: T | null; error: string | null }`
- Show loading state during submission (`useTransition` or `useFormStatus`)
- Disable submit button during submission — prevent double-submit

## Data Table Patterns

Used for: member lists, visitor pipeline, referral history.
Build with TanStack Table + ShadCN DataTable pattern.
- Mobile: card list view (no horizontal scroll tables on mobile)
- Desktop: full table with sortable columns
- Empty state: always show a helpful message, not a blank table

## Loading States

Every async component must have a loading state:
- Data tables: show 3 skeleton rows at the expected row height
- Member cards: show avatar skeleton + two text line skeletons
- Search results: show 3 MatchResultCard skeletons
- Profile: show full-page skeleton matching the profile layout

Never use a spinner alone — show the skeleton of the content shape.

## At-Risk Member Indicator

Used in Chapter Director and Network Admin dashboards:
- Amber dot (bg-amber-500) next to member name
- Tooltip: "Engagement score [X]/100 — membership expires in [N] days"
- Never show the raw score to the member themselves — only to directors and admins
