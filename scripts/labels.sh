#!/usr/bin/env bash
set -euo pipefail
# requires: gh CLI (gh auth login)
declare -a labels=(
  "type:feature#3b82f6"
  "type:bug#ef4444"
  "type:epic#8b5cf6"
  "priority:triage#6b7280"
  "priority:high#f59e0b"
  "good first issue#10b981"
)
for l in "${labels[@]}"; do
  name="${l%#*}"; color="${l#*#}"
  gh label create "$name" --color "$color" --force || true
done
echo "✅ labels synced"
