# Resume here — Keycloak MCP + skills work

Last updated: 2026-10-09

## Where things live

| Piece              | Path                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| MCP fork           | `/home/edewit/workspace/mcp-keycloak-admin` (`origin` = edewit, `upstream` = mrz1880) |
| Active branch      | `feat/auth-flow-mutation`                                                             |
| Upstream PR        | https://github.com/mrz1880/mcp-keycloak-admin/pull/36                                 |
| Cursor MCP config  | `~/.cursor/mcp.json` (not under `skills/`)                                            |
| Skills (knowledge) | `~/.cursor/skills/keycloak/`                                                          |
| Plan               | `~/.cursor/plans/Keycloak MCP approach-1a7eb3cf.plan.md`                              |

## Done

- [x] Fork + local Cursor wiring (`docs/cursor-local.md`)
- [x] Flow tools: list / executions list / copy / bind
- [x] Execution mutation: list authenticator providers, add, update requirement, raise/lower priority, delete (confirm)
- [x] Unit tests green (255); live smoke of copy+bind+restore against local Keycloak
- [x] Skill router + recipes: OIDC client, browser flow, IdP federation, ACR/LoA stubs
- [x] MCP config corrected to `~/.cursor/mcp.json`

## Still to do (MCP fork / PR #36)

Priority order:

1. **Land / iterate PR #36** — respond to review; rebase on `upstream/main` when needed.
2. **Realm write tools** (next feature branch after #36, or follow-up PR):
   - [ ] Update realm SMTP settings (read-merge-write)
   - [ ] Get/set realm attributes (e.g. `acr.loa.map`)
   - [ ] Client attribute helpers if `keycloak_client_update` is too narrow for ACR / `minimum.acr.value`
3. **Flow extras** (optional):
   - [ ] Create nested sub-flow nodes
   - [ ] Delete custom flow by **id** (alias DELETE 404s on Keycloak)
   - [ ] Configure execution config (configurable authenticators)
4. **Organizations APIs** — if corporate-SSO recipes need them
5. **Partial import** tool — for flow JSON assets
6. **Integration tests** — Testcontainers coverage for new auth tools (`npm run test:integration`)
7. **Hygiene** — ignore stray `pnpm-lock.yaml` if present; prefer npm/`package-lock.json`

## Still to do (skills / Phase Two)

1. **Adapt Phase Two REST recipes** (CC BY-SA — attribute Phase Two, mark changes):
   - [x] `admin-passwordless-passkey` — adapted (MCP gaps: create flow shell, realm WebAuthn policy)
   - [x] `admin-credential-enrollment` — adapted
   - [x] `admin-corporate-sso` — adapted (native orgs vs keycloak-orgs called out; org MCP gap)
   - [x] `flow-execution-order` — condensed traps doc
   - [ ] `admin-idp-federation` — deepen further from P2 + `references/idp/*` vendor notes
   - [ ] Optional: copy useful `references/idp/*.md` vendor snippets with attribution
2. **Skip / defer:** `*-mcp.md`, magic-link / email-OTP / zero-password unless extension jars are in scope; cluster/deployment
3. **SMTP recipe** once realm SMTP MCP tool exists
4. **Harden ACR/LoA recipe** once client/realm attribute tools exist
5. **Verify-by-re-read** — present in new recipes; keep enforcing

## Quick restart commands

```bash
cd /home/edewit/workspace/mcp-keycloak-admin
git checkout feat/auth-flow-mutation
git fetch upstream origin
npm install && npm test && npm run build

# Cursor: ensure ~/.cursor/mcp.json points at dist/index.js; new chat after rebuild
```

## Suggested next session

Either:

- **A.** Phase Two skill adaptation (knowledge layer) — no MCP code required, or
- **B.** Realm SMTP / attribute write tools on a new branch off `feat/auth-flow-mutation` or `main` after #36 merges
