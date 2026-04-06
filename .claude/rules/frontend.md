---
paths:
  - "src/**/*.{ts,tsx}"
  - "src/components/**/*"
  - "src/app/**/*.{ts,tsx}"
---

# Frontend Conventions

## TypeScript
- Strict mode. No `any`. No type assertions (`as Type`) without a comment explaining why.
- Explicit return types on all functions. No inferred return types on exported functions.
- Use `interface` for object shapes; `type` for unions, intersections, and primitives.

## React Patterns
- Functional components only. No class components.
- Named exports only. No default exports.
- Co-locate component tests: `member-card.test.tsx` next to `member-card.tsx`

## Server vs Client Components
- Default to Server Components (no `'use client'` directive)
- Add `'use client'` only when: hooks, event handlers, browser APIs, or Realtime subscriptions
- Never fetch data in a Client Component — pass data as props from Server Components
- Data fetching belongs in Server Components or Server Actions, not `useEffect`

## Mobile-First
- Every component is designed for 375px viewport first
- Use Tailwind responsive prefixes in order: base (mobile) → md: → lg:
- Bottom navigation on mobile, sidebar on desktop — use the existing layout shell
- Touch targets minimum 44px height on mobile (use min-h-11 utility)

## Mutations
- All mutations via Server Actions in src/lib/actions/
- Use `useTransition` for non-form Server Action calls to show loading state
- Use `useFormStatus` inside forms for submit button loading state
- Show inline field errors on validation failure (never toast for validation)
- Show toast for success confirmations (3 seconds, non-blocking)
- Disable submit button during pending state — prevent double-submit

## Loading States
- Every async component needs a Suspense boundary with a skeleton fallback
- Match the skeleton shape to the content it replaces (not a generic spinner)
- Use ShadCN Skeleton component for all loading states

## Error States
- Every data-fetching component needs an error state (not just a loading state)
- Error states show a human message and a retry action where possible
- Never show raw database error messages to the user

## Styling
- Tailwind utility classes only. No custom CSS unless no Tailwind equivalent exists.
- Use `cn()` from src/lib/utils for conditional class merging
- Never hardcode hex colors — use CSS variables and Tailwind tokens
- ShadCN component files in src/components/ui/ are never modified directly

## Accessibility
- All interactive elements have keyboard navigation support
- All images have meaningful alt text (or alt="" if decorative)
- Form inputs have associated labels (use ShadCN Label component)
- ARIA labels on icon-only buttons
- Color is never the only way to communicate information (use icons + color)
