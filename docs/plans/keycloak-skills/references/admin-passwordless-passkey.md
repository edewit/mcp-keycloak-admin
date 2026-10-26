<!--
  Adapted from "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/admin-passwordless-passkey.md)
  Licensed under CC BY-SA 4.0. Changes were made: mcp-keycloak-admin tools,
  stock Keycloak only.
-->

# Passkey-only passwordless login (stock Keycloak)

## Goal

Passwordless via WebAuthn **passwordless** authenticators (discoverable/resident
credentials). Not magic-link. Keycloak ships **no** built-in passkey-only browser
flow — author one, bind it, then bootstrap credentials via enrollment email.

Done when: passwordless policy set, custom flow bound (no password form), SMTP +
`webauthn-register-passwordless` enrollment sent for zero-credential users.
WebAuthn login itself needs a real browser ceremony — do not forge credentials.

## Tools

| Step | Tool |
| --- | --- |
| Passwordless policy / SMTP | `keycloak_realm_update` → verify `keycloak_realm_get_config` |
| Empty top-level flow | `keycloak_auth_flow_create` |
| Nested forms sub-flow | `keycloak_auth_flow_subflow_add` |
| Add authenticators | `keycloak_auth_flow_execution_add` (+ providers list) |
| Set requirements / order | `keycloak_auth_flow_execution_update` / raise / lower priority |
| Bind | `keycloak_auth_flow_bind` (realm) or client override via client update |
| Enrollment | `admin-credential-enrollment.md` variant B |

Do **not** copy stock `browser` (keeps password / Kerberos / IdP redirector).
Do **not** use `partialImport` for authentication flows.

SkillsBench attaches this MCP via `sandbox.mcp_servers` (stdio). Admin REST is
only a fallback for true MCP gaps — see `SKILL.md` Step 0.

## Stage 1 — WebAuthn PASSWORDLESS policy

Separate fields from ordinary 2FA WebAuthn (`webAuthnPolicy*` without
`Passwordless`):

```
keycloak_realm_update
  webAuthnPasswordlessPolicy:
    rpEntityName: <name>
    rpId: <hostname the browser uses, e.g. localhost>
    requireResidentKey: "Yes"
    userVerificationRequirement: "preferred"
```

Wrong/empty `rpId` fails **client-side** with almost no server signal.
Verify with `keycloak_realm_get_config`.

## Stage 2 — Author the flow

Target shape (top level all-ALTERNATIVE):

```
Passkey Only
├── auth-cookie                         ALTERNATIVE
└── Passkey Only forms                  ALTERNATIVE  (sub-flow)
    └── webauthn-authenticator-passwordless REQUIRED
```

Sub-flow is load-bearing: REQUIRED beside ALTERNATIVE at the **same** level clears
the alternative bucket (cookie SSO dies). See `flow-execution-order.md`.

1. `keycloak_auth_flow_create` — alias `Passkey Only`
2. `keycloak_auth_flow_execution_add` — `auth-cookie` on that flow
3. `keycloak_auth_flow_subflow_add` — parent `Passkey Only`, alias `Passkey Only forms`
4. `keycloak_auth_flow_execution_add` — `webauthn-authenticator-passwordless` on the **forms** alias
5. `keycloak_auth_flow_executions_list` then `_execution_update`:
   - cookie → ALTERNATIVE; sub-flow → ALTERNATIVE; webauthn → REQUIRED
6. Reorder with raise/lower priority if append order is wrong

Executions add does **not** dedupe — list before adding.

## Stage 3 — Bind

- **One app only:** client `authenticationFlowBindingOverrides.browser` = flow **id**
  (read-merge-write the client). Prefer this when the request is about a single portal.
- **Whole realm:** `keycloak_auth_flow_bind` with `browserFlow` = flow **alias**.
  Affects admin/account consoles too — confirm before doing this in shared realms.

## Stage 4 — SMTP + enrollment

Zero-credential users cannot register a passkey without bootstrap. Follow
`admin-credential-enrollment.md` variant B with action
`webauthn-register-passwordless`.

1. `keycloak_realm_update` with `smtpServer` (`host`, `from`, …).
2. Ensure required action registered **and enabled**.
3. Send execute-actions email for each credential-less user with `emailVerified: true`.
4. Confirm mail was accepted/delivered — send API failures are often silent.

Do **not** set a temporary password to “help” enrollment.

## Verify

- Executions match the shape above; no username-password form in the bound flow.
- `keycloak_realm_get_config` shows passwordless `rpId` and SMTP host.
- Enrollment mails sent; users still have **no password** credential.

## Traps

| Symptom | Cause |
| --- | --- |
| Ceremony fails in browser, useless server error | Bad/empty passwordless `rpId` |
| execute-actions-email “ok” but no mail | SMTP missing/wrong |
| Login still shows password | Copied `browser` or left Username Password Form |
| Cookie SSO never runs | REQUIRED + ALTERNATIVE siblings at one level |
