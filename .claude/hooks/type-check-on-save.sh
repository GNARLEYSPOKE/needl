#!/bin/bash
# type-check-on-save.sh
# Runs TypeScript type check after any .ts or .tsx file is written
# Only runs on TypeScript files — skips SQL, markdown, JSON

FILE="$1"

if [[ "$FILE" != *.ts && "$FILE" != *.tsx ]]; then
  exit 0
fi

# Only run if package.json exists (project is initialized)
if [ ! -f "package.json" ]; then
  exit 0
fi

echo "Running TypeScript check after save of $FILE..."
npm run type-check --silent 2>&1

if [ $? -ne 0 ]; then
  echo ""
  echo "TypeScript errors detected. Fix before proceeding."
  echo "Run 'npm run type-check' to see the full error list."
  exit 1
fi

exit 0
