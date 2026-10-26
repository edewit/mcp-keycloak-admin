# Resume here — Keycloak MCP + skills work

Last updated: 2026-10-09

**Local only** (`STATUS.md` is gitignored). Not part of upstream PR #36.

## Where things live

| Piece | Path |
| --- | --- |
| MCP fork | `/home/edewit/workspace/mcp-keycloak-admin` (`origin` = edewit, `upstream` = mrz1880) |
| Active branch / PR | `feat/auth-flow-mutation` → https://github.com/mrz1880/mcp-keycloak-admin/pull/36 |
| Cursor MCP config | `~/.cursor/mcp.json` |
| Skills (local) | `docs/plans/keycloak-skills/` → `~/.cursor/skills/keycloak` |
| Benchmarks (local) | `docs/plans/benchmarks/` — P2 tasks + our skill pack + baked MCP |
| Plan | `~/.cursor/plans/Keycloak MCP approach-1a7eb3cf.plan.md` |

## PR #36 scope (expanded)

Flow + realm gaps for passkey recipes are in this PR. Still defer:

- Realm attributes / `acr.loa.map`
- Orgs, partial import, integration tests

## Done (on PR #36)

- [x] Flow tools: list / executions / copy / bind
- [x] Execution mutation: providers, add, update, priority, delete
- [x] Empty flow create + nested sub-flow add
- [x] Realm update: SMTP + WebAuthn passwordless policy (read-merge-write)
- [x] Unit tests + live smoke copy/bind/restore

## Done (local only, not in PR)

- [x] Skills under `docs/plans/keycloak-skills/` (Phase Two–adapted recipes)
- [x] Cursor MCP at `~/.cursor/mcp.json`
- [x] Adapted P2 benchmarks for current skills (passkey, enrollment, IdP federation, corporate SSO)
- [x] Passkey recipe rewritten to prefer MCP
- [x] SkillsBench images bake Node mcp-keycloak-admin; task.md declares stdio MCP

## Still to do (separate PRs / local)

1. Land / iterate PR #36
2. Agent runs with `--skill-mode with-skill` vs `no-skill` (MCP now in sandbox)
3. Realm attributes / ACR helpers (follow-up PR)
4. Integration tests for auth tools

## Benchmarks quick start

```bash
cd /home/edewit/workspace/mcp-keycloak-admin
./docs/plans/benchmarks/sync-skills.sh   # after editing skills
uv tool install benchflow                # once
bench tasks check docs/plans/benchmarks/keycloak-passwordless-passkey-login
bench eval run \
  --tasks-dir docs/plans/benchmarks/keycloak-passwordless-passkey-login \
  --agent oracle --sandbox docker
# See docs/plans/benchmarks/README.md
```

## Quick restart

```bash
cd /home/edewit/workspace/mcp-keycloak-admin
git checkout feat/auth-flow-mutation
npm install && npm test && npm run build
# Skills: ~/.cursor/skills/keycloak → docs/plans/keycloak-skills
```
