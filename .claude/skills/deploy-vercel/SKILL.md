---
name: deploy-vercel
description: Deploy Needl to Vercel staging or production. Runs type-check, lint, build, and RLS audit before deploying. Use when ready to deploy a tested feature branch.
disable-model-invocation: true
allowed-tools: Bash(npm *) Bash(vercel *) Bash(git *) Bash(supabase *)
---

Deploy $ARGUMENTS to Vercel.

Pre-flight checks (abort immediately if any fail — do not proceed to deploy):
1. `npm run type-check` — must pass with zero errors
2. `npm run lint` — must pass with zero warnings
3. `npm run build` — must build successfully, zero errors
4. `git status` — must have no unstaged changes
5. RLS audit: confirm chapter_memberships has both indexes, matches has no DELETE policy

Deploy:
- Staging: `vercel --env preview`
- Production: `vercel --prod` — only when argument explicitly includes "production"

Post-deploy:
- Confirm deployment URL is live (HTTP 200 on /)
- Smoke test: /sign-in loads, /search loads
- Confirm Sentry is receiving events (check Sentry dashboard for the deployment)
- Report deployment URL and environment

If any pre-flight check fails, stop. Report the specific error with the exact command output.
Do not deploy broken code to any environment.

Note: Never deploy to production without explicit "production" in the $ARGUMENTS.
Staging deploys are safe to run on any branch. Production deploys require main branch.
