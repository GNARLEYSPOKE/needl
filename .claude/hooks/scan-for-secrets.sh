#!/bin/bash
# scan-for-secrets.sh
# Blocks writes that contain patterns matching API keys or secrets

FILE="$1"
CONTENT="$2"

SECRET_PATTERNS=(
  "sk-[a-zA-Z0-9]{40,}"
  "SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"][a-zA-Z0-9._-]{100,}"
  "stripe_secret_key\s*=\s*['\"]sk_"
  "ANTHROPIC_API_KEY\s*=\s*['\"]sk-ant"
  "OPENAI_API_KEY\s*=\s*['\"]sk-"
  "CLERK_SECRET_KEY\s*=\s*['\"]sk_"
  "RESEND_API_KEY\s*=\s*['\"]re_"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  if echo "$CONTENT" | grep -qP "$pattern" 2>/dev/null || \
     echo "$CONTENT" | grep -qE "$pattern" 2>/dev/null; then
    echo "BLOCKED: Potential secret detected in $FILE"
    echo "Pattern matched: $pattern"
    echo "Use environment variables. Never hardcode secrets in source files."
    exit 1
  fi
done

exit 0
