---
name: create-component
description: Create a new React component following Needl conventions. Use when building any new UI component — profile cards, match results, ask forms, intro flows, admin dashboard elements.
argument-hint: [ComponentName] [description of what it does and where it appears]
allowed-tools: Read Write Glob
---

Create a component named $ARGUMENTS[0] that: $ARGUMENTS[1]

Steps:

1. Read src/components/ui/ to check if ShadCN already has a suitable primitive
2. Read docs/ui-system.md for the relevant screen pattern (search, profile, ask, intro, admin)
3. Determine: Server Component or Client Component?
   - Default: Server Component
   - Use Client only if: hooks, event handlers, browser APIs, or Realtime
4. Determine correct file location:
   - Shared across features: src/components/[component-name].tsx
   - Feature-specific: src/components/[feature]/[component-name].tsx
   - Feature options: search, profile, asks, introductions, chapter, admin
5. Implement with:
   - Named export (no default export)
   - Explicit TypeScript interface for props (no implicit any)
   - Mobile-first: 375px layout first, responsive up
   - Loading state using ShadCN Skeleton (match content shape)
   - Error state with human message and retry if applicable
   - ARIA labels on all interactive elements
   - Touch targets minimum 44px height (min-h-11)
6. Create co-located test file: [component-name].test.tsx
   - Happy path test
   - Loading state test (if async)
   - Error state test
   - Mobile viewport test (375px)

Confirm in one sentence before creating: Server or Client, file path, and why.
Do not create the component until confirmation is given.
