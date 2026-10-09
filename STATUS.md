# Resume here — Keycloak MCP + skills work

Last updated: 2026-10-09

## Where things live

| Piece              | Path                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| MCP fork           | `/home/edewit/workspace/mcp-keycloak-admin` (`origin` = edewit, `upstream` = mrz1880)                                          |
| Active branch      | `feat/auth-flow-mutation`                                                                                                      |
| Upstream PR        | https://github.com/mrz1880/mcp-keycloak-admin/pull/36                                                                          |
| Cursor MCP config  | `~/.cursor/mcp.json` (not under `skills/`)                                                                                     |
| Skills (knowledge) | **In repo:** `skills/keycloak/` — Cursor sees `.cursor/skills/keycloak` → symlink; optional `~/.cursor/skills/keycloak` → same |
| Plan               | `~/.cursor/plans/Keycloak MCP approach-1a7eb3cf.plan.md`                                                                       |

## Done

- [x] Fork + local Cursor wiring (`docs/cursor-local.md`)
- [x] Flow tools: list / executions list / copy / bind
- [x] Execution mutation: list authenticator providers, add, update requirement, raise/lower priority, delete (confirm)
- [x] Unit tests green; live smoke of copy+bind+restore against local Keycloak
- [x] Skills **versioned in the project** under `skills/keycloak/`
- [x] MCP config at `~/.cursor/mcp.json`
- [x] Phase Two–adapted recipes: passkey, credential enrollment, corporate SSO, flow-execution-order (CC BY-SA attributed)

## Still to do (MCP fork / PR #36)

1. **Land / iterate PR #36** — respond to review; rebase on `upstream/main` when needed.
2. **Realm write tools** (follow-up PR):
   - [ ] Update realm SMTP settings (read-merge-write)
   - [ ] Get/set realm attributes (e.g. `acr.loa.map`)
   - [ ] Client attribute helpers if needed for `minimum.acr.value`
3. **Flow extras** (optional): create nested sub-flows; delete flow by **id**; execution config
4. **Organizations APIs** — if corporate-SSO recipes need them
5. **Partial import** tool
6. **Integration tests** for new auth tools

## Still to do (skills / Phase Two)

1. Deepen `admin-idp-federation` + optional vendor notes from P2 `references/idp/*`
2. SMTP + ACR recipes once realm/client attribute MCP tools exist
3. Skip extension-only / `*-mcp.md` / cluster unless in scope

## Quick restart

```bash
cd /home/edewit/workspace/mcp-keycloak-admin
git checkout feat/auth-flow-mutation
git fetch upstream origin
npm install && npm test && npm run build
# Ensure ~/.cursor/mcp.json; new agent chat after rebuild
```
