# Resume here — Keycloak MCP + skills work

Last updated: 2026-10-28

## Where things live

| Piece | Path |
| --- | --- |
| Canonical repo | [edewit/mcp-keycloak-admin](https://github.com/edewit/mcp-keycloak-admin) (`origin`) — **use `main`** |
| Upstream (optional sync) | `upstream` → [mrz1880/mcp-keycloak-admin](https://github.com/mrz1880/mcp-keycloak-admin) |
| Cursor MCP config | `~/.cursor/mcp.json` — see [docs/cursor-local.md](../cursor-local.md) |
| Skill pack | `docs/plans/keycloak-skills/` → install under `~/.cursor/skills/keycloak` |
| SkillsBench tasks | `docs/plans/benchmarks/` (job run artifacts stay local; see `.gitignore`) |

Upstream PR [#36](https://github.com/mrz1880/mcp-keycloak-admin/pull/36) is superseded by this fork’s `main` if the maintainer does not merge.

## Done (on fork `main`)

- [x] Flow tools: list / executions / copy / bind / create / sub-flow
- [x] Execution mutation: providers, add, update, priority, delete
- [x] Realm update: SMTP + WebAuthn passwordless policy (read-merge-write)
- [x] Unit tests for the above
- [x] Skills under `docs/plans/keycloak-skills/` (Phase Two–adapted recipes)
- [x] Adapted P2 benchmarks (passkey, enrollment, IdP federation, corporate SSO) with baked Node MCP
- [x] Dependabot bumps merged on the fork
- [x] Claude Sonnet **with-skill** on `keycloak-passwordless-passkey-login` → **100%** (6/6 verifier)
- [x] Organizations MCP (`keycloak_org_*` + `organizationsEnabled`)
- [x] Recipe MCP gaps closed: ACR/`acrLoaMap`, IdP update/`trustEmail`, user credentials list, client browser flow override

## Still to do

1. Point day-to-day Cursor / agents at this fork (`npm run build` + local `dist/`, or publish from the fork)
2. Claude with-skill on the other three benchmark tasks (corporate SSO, IdP federation, enrollment)
3. Integration tests for auth / realm / org mutation tools
4. User `requiredActions` on update; IdP mapper CRUD; authz write tools
5. Partial realm import (only if a recipe needs it)

## Benchmarks quick start

```bash
cd /home/edewit/workspace/mcp-keycloak-admin
npm run build
./docs/plans/benchmarks/sync-skills.sh   # after editing skills or MCP
uv tool install benchflow                # once
bench tasks check docs/plans/benchmarks/keycloak-passwordless-passkey-login
bench eval run \
  --tasks-dir docs/plans/benchmarks/keycloak-passwordless-passkey-login \
  --agent oracle --sandbox docker
# See docs/plans/benchmarks/README.md
```

Job outputs land under `docs/plans/benchmarks/jobs/` (gitignored).

## Quick restart

```bash
cd /home/edewit/workspace/mcp-keycloak-admin
git checkout main && git pull
npm install && npm test && npm run build
# Skills: symlink or copy docs/plans/keycloak-skills → ~/.cursor/skills/keycloak
```
