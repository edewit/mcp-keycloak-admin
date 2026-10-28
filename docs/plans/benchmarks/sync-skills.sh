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
  # Production-only package.json so image `npm ci --omit=dev` is not blocked by
  # devDependency peer conflicts (e.g. typescript 7 vs typescript-eslint).
  python3 - "$REPO/package.json" "$mcp_dest/package.json" <<'PY'
import json, sys
src, dst = sys.argv[1], sys.argv[2]
pkg = json.load(open(src))
slim = {k: pkg[k] for k in (
    "name", "version", "description", "license", "type", "bin", "engines",
    "dependencies",
) if k in pkg}
json.dump(slim, open(dst, "w"), indent=2)
open(dst, "a").write("\n")
PY
  cp "$REPO/package-lock.json" "$mcp_dest/"
  cp -a "$REPO/dist" "$mcp_dest/dist"

  echo "synced $name (skills + mcp)"
done
