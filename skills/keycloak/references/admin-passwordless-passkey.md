<!--
  Adapted from "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/admin-passwordless-passkey.md)
  Licensed under CC BY-SA 4.0. Changes were made: retargeted to mcp-keycloak-admin
  tools, stock Keycloak paths only, removed Phase Two extension/import shortcuts.
-->

# Passkey-only passwordless login (stock Keycloak)

## What this is

Passwordless via WebAuthn **passwordless** authenticators (discoverable/resident
credentials). Not magic-link (email proof). Keycloak ships **no** built-in
passkey-only browser flow — you author one, then bind it.

## Tools / fallbacks

| Step                                         | Prefer                                                                         | Fallback                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| List / copy / bind flows                     | `keycloak_auth_flows_*`                                                        | Admin REST                                                     |
| List / add / update executions               | `keycloak_auth_flow_execution_*`, `keycloak_auth_authenticator_providers_list` | Admin REST                                                     |
| Create empty top-level flow + sub-flow shell | **MCP gap**                                                                    | `POST .../authentication/flows` and `.../executions/flow`      |
| Realm WebAuthn passwordless policy           | **MCP gap**                                                                    | Realm GET → merge passwordless fields → PUT (read-merge-write) |

Do **not** use `partialImport` for authentication flows — Keycloak ignores them
(HTTP 200, nothing added).

## Steps

1. **WebAuthn passwordless policy** (realm representation, read-merge-write):
   - `webAuthnPolicyPasswordlessRpEntityName`
   - `webAuthnPolicyPasswordlessRpId` — set explicitly to the hostname the browser uses (empty/`mismatched` fails **client-side** with little server signal)
   - `webAuthnPolicyPasswordlessRequireResidentKey`: `"Yes"` for username-less discoverable credentials
   - `webAuthnPolicyPasswordlessUserVerificationRequirement`: `"preferred"` or `"required"`
2. **Author flow** (if no suitable custom flow exists):
   - Create empty top-level basic-flow (REST until MCP can).
   - Shape: top-level `auth-cookie` **ALTERNATIVE**, plus an **ALTERNATIVE** sub-flow that contains `webauthn-authenticator-passwordless` **REQUIRED**.
   - Why the sub-flow: a REQUIRED sibling of an ALTERNATIVE at the **same** level makes Keycloak clear the alternative bucket — cookie SSO would never run. See `flow-execution-order.md`.
   - Use `keycloak_auth_flow_execution_add` / `_update` when the shell exists; verify with `keycloak_auth_flow_executions_list`.
3. **Bind:** `keycloak_auth_flow_bind` with `binding: "browserFlow"`.
4. **Enrollment:** users need a passwordless WebAuthn credential — follow `admin-credential-enrollment.md`. A perfect flow with zero credentials helps nobody.

## Verify

- Re-list executions: cookie ALTERNATIVE at top; passkey REQUIRED inside sub-flow.
- Realm still has other settings after policy PUT (read-merge-write).
- Real browser login (WebAuthn cannot be verified with curl alone).

## Traps

- Confusing 2FA WebAuthn policy fields with **passwordless** (`webAuthnPolicyPasswordless*`) fields.
- Editing the built-in `browser` flow in place — copy or create a new flow.
- Wrong shape (REQUIRED next to ALTERNATIVE at one level) silently drops alternatives.
- Assuming create order = runtime order — always re-list executions.
