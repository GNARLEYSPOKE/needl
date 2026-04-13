# Needl — Backlog

Items to address during development. Claude Code: check this file at the start of each phase for anything relevant to the current work.

Format: `- [ ] [item] (surface: [phase or timing])` — check the box when done.

---

## Bugs

- [x] Search spec incorrectly excludes requester's own chapter from results. Search should include ALL chapters within the same organization, including the requester's own chapter. Update the search_members function and any filters in the search Server Action. (surface: Phase 4 fix, before Phase 5)
- [x] Chapter ask board: each ask card should display the name of the member who posted the ask. Currently shows ask body but not who. (surface: pre-demo polish)

## Features

- [x] Search filter: add "My Chapter" toggle alongside the region filters (All regions, Canada, US, UK, Australia). When selected, restricts results to members in the user's own chapter only. (surface: pre-demo polish)
- [x] Asks page: add a delete option on each ask card in "Your Asks" view. Should soft-delete or hard-delete with confirmation. Only the ask owner can delete their own asks. (surface: pre-demo polish)

## Tech Debt

- [ ] QA skill should verify Edge Function secrets are set and valid (OPENAI_API_KEY, etc.) before marking embedding pipeline as ready. Also verify supabase db push has been run for all committed migrations. (surface: before Phase 5)
- [ ] Configure daily cron schedule for nudge-onboarding Edge Function in Supabase dashboard. See supabase/functions/\_shared/cron-config.md for details. (surface: Phase 11)
- [ ] Configure weekly cron schedule for score-engagement Edge Function in Supabase dashboard. (surface: Phase 11)

## Questions to Resolve
