# Needl — Initial Claude Code Prompt

Paste this entire document as your first message to Claude Code from inside the project directory.

---

You are building **Needl** — an AI-powered member network platform for franchise-model networking organizations. First customer is Corporate Connections Canada. Built to sell to BNI Global.

**Enter Plan Mode before doing anything else. Press Shift+Tab twice now.**

---

## Your Context

Read these files in this exact order before planning anything:

1. `CLAUDE.md` — project conventions, stack, commands, quality policy
2. `ECOSYSTEM.md` — domain model, entity types, RLS summary, matching query
3. `specs/requirements.md` — what we're building, for whom, and what we are NOT building
4. `specs/design.md` — every architectural decision already made, with rationale
5. `specs/tasks.md` — the ordered implementation checklist, phase by phase

Do not skip any file. Do not begin planning until you have read all five.

---

## Critical Facts to Hold in Memory

**The load-bearing table is `chapter_memberships`.** Almost every meaningful query joins through it. Indexes on `(chapter_id, status)` and `(member_id, status)` must exist from migration 003. Do not remove or defer these.

**The embedding pipeline is always async.** When a member profile or ask is saved, the UI returns immediately. A Supabase database webhook triggers an Edge Function that calls OpenAI text-embedding-3-small and writes the embedding back. Never await an embedding call in a Server Action.

**The `matches` table is append-only.** There is no DELETE RLS policy on this table. Do not add one. It is the AI engine audit trail.

**Every external service has an abstraction interface in `src/lib/services/`.** Never call Resend, OpenAI, Anthropic, or Stripe SDKs directly from Server Actions or components. The service layer is how this product becomes acquisition-ready.

**data_residency is required on the members table.** char(2) field. "CA" for Canadian deployments. Required for PIPEDA compliance. Do not omit.

**Cross-chapter profile visibility is restricted.** Members can see: company_name, tagline, what_i_do, who_i_serve, geography_served, standing asks. Members cannot see: email, phone, referral history, membership status. This is enforced at the RLS policy level, not the application level.

**Seed the database before any demo.** Zero search results kills a demo. Use the `/seed-database` skill before presenting anything to Corporate Connections leadership.

---

## Your Constraints

- TypeScript strict mode throughout. Zero `any`. Explicit return types on all exports.
- RLS policies required for every new table. In the same migration file as the table. No exceptions.
- Named exports only. No default exports. Anywhere.
- Server Components by default. `use client` only when hooks, event handlers, or browser APIs are required.
- No placeholder implementations. No `// TODO` in any committed code.
- All Server Actions: validate session → validate input (Zod) → check role → execute → return `{ data, error }`.
- Never call vendor SDKs outside `src/lib/services/`.
- Mobile-first. Every screen must work on 375px viewport.
- Commit after every phase in `specs/tasks.md`.

---

## Your First Task

Implement **Phase 0** from `specs/tasks.md`: Project Scaffold.

Before writing a single line of code:

1. Confirm you have read all five files listed above (name one key fact from each)
2. Present a plan for Phase 0 covering these points:
   - Next.js initialization command you will run
   - ShadCN components you will install
   - Service abstraction interfaces you will create in `src/lib/services/`
   - Environment variables that will go in `.env.local`
   - How you will confirm the CI/CD pipeline is working
3. Wait for approval before executing

When Phase 0 is complete:

- Run `npm run type-check` — must pass
- Run `npm run lint` — must pass
- Run `npm run build` — must pass
- Commit: `feat: initial project scaffold`
- Ask: "Phase 0 complete. Ready to start Phase 1: Database Foundation?"

---

## Quality Gate (runs before every commit)

```bash
npm run type-check   # zero errors
npm run lint         # zero warnings
npm run build        # successful (after Phase 0)
```

If any command fails, fix it before committing. Do not move to the next phase with failing checks.

---

## Skills Available

Use these by typing the skill name in Claude Code:

- `/review-pr` — before merging any branch
- `/db-migration [description]` — before creating any migration manually
- `/deploy-vercel [staging|production]` — before any deployment
- `/create-component [Name] [description]` — when building any new UI component
- `/seed-database [local|staging]` — before any demo or stakeholder presentation
- `/audit-rls` — before any production deployment (mandatory)

---

## When You Get Stuck

1. Re-read the relevant section of `ECOSYSTEM.md` before asking
2. Check `docs/architecture.md` for the data flow diagram for your current task
3. Check `docs/api-contracts.md` for Server Action patterns
4. Use `/clear` if context is getting noisy, then re-read CLAUDE.md
5. Use `/compact` with "preserve: service abstraction layer, current phase, error states" before context limit

Ready. Enter Plan Mode and read the five files.
