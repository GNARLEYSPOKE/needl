#!/bin/bash
# block-dangerous-commands.sh
# Blocks destructive bash commands from running inside Claude Code sessions

COMMAND="$1"

BLOCKED_PATTERNS=(
  "supabase db reset --linked"
  "DROP TABLE"
  "DROP DATABASE"
  "DELETE FROM.*WHERE 1=1"
  "rm -rf /"
  "git push --force origin main"
  "vercel --prod"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo "BLOCKED: '$pattern' is a dangerous command that requires manual execution."
    echo "Run this command yourself in the terminal if you are certain."
    exit 1
  fi
done

exit 0
