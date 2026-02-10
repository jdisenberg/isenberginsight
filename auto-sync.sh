#!/bin/zsh
set -euo pipefail

# Auto-sync local changes to origin/main at a fixed interval.
# Usage:
#   ./auto-sync.sh
#   ./auto-sync.sh 60
#   ./auto-sync.sh 120 "Auto sync commit"

INTERVAL_SECONDS="${1:-60}"
COMMIT_PREFIX="${2:-Auto sync}"

if ! [[ "$INTERVAL_SECONDS" =~ '^[0-9]+$' ]] || [[ "$INTERVAL_SECONDS" -lt 5 ]]; then
  echo "Interval must be a number >= 5 seconds."
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "This script must be run from inside a git repository."
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Current branch is '$CURRENT_BRANCH'. Switch to 'main' before running auto-sync."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' is not configured."
  exit 1
fi

echo "Auto-sync started on branch 'main'."
echo "Checking every ${INTERVAL_SECONDS}s. Press Ctrl+C to stop."

while true; do
  # Skip while merge/rebase is in progress.
  if [[ -f .git/MERGE_HEAD ]] || [[ -d .git/rebase-apply ]] || [[ -d .git/rebase-merge ]]; then
    echo "Merge/rebase in progress. Skipping this cycle."
    sleep "$INTERVAL_SECONDS"
    continue
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
    COMMIT_MSG="${COMMIT_PREFIX} (${TIMESTAMP})"
    echo "Changes detected. Committing and pushing: ${COMMIT_MSG}"

    git add -A
    git commit -m "$COMMIT_MSG" || true

    # Commit may no-op if only ignored metadata changed.
    if [[ -n "$(git rev-list --left-right --count origin/main...main 2>/dev/null | awk '{print $2}')" ]]; then
      git push origin main
      echo "Pushed to origin/main."
    else
      # Fallback push anyway; harmless if already up-to-date.
      git push origin main || true
    fi
  else
    echo "No changes."
  fi

  sleep "$INTERVAL_SECONDS"
done
