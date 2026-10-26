#!/usr/bin/env bash
# Refresh environment/skills/keycloak and stage mcp-keycloak-admin for every task.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
SRC="$(cd "$ROOT/../keycloak-skills" && pwd)"

if [[ ! -f "$REPO/dist/index.js" ]]; then
  echo "dist/index.js missing — run 'npm run build' at repo root first" >&2
  exit 1
fi
if [[ ! -f "$REPO/package-lock.json" ]]; then
  echo "package-lock.json missing at repo root" >&2
  exit 1
fi

for task in "$ROOT"/keycloak-*/; do
  [[ -d "$task/environment" ]] || continue
  name="$(basename "$task")"

  dest="$task/environment/skills/keycloak"
  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  cp -a "$SRC" "$dest"

  mcp_dest="$task/environment/mcp-keycloak-admin"
  rm -rf "$mcp_dest"
  mkdir -p "$mcp_dest"
  cp "$REPO/package.json" "$REPO/package-lock.json" "$mcp_dest/"
  cp -a "$REPO/dist" "$mcp_dest/dist"

  echo "synced $name (skills + mcp)"
done
