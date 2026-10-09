<!--
  Adapted from "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/admin-credential-enrollment.md)
  Licensed under CC BY-SA 4.0. Changes were made: retargeted to mcp-keycloak-admin
  tools and stock Keycloak Admin REST fallbacks.
-->

# Enroll a credential on an existing user

Passwordless / step-up flows fail silently if **no user has the credential**.
Pick the variant from facts about the user, not preference.

|                       | A — required action on next login | B — execute-actions email       |
| --------------------- | --------------------------------- | ------------------------------- |
| Prerequisite          | User can already authenticate     | Realm SMTP + **verified** email |
| Zero-credential user? | No                                | Yes                             |
| SMTP needed?          | No                                | Yes                             |

## Tools

- `keycloak_user_search` / `keycloak_user_get`
- `keycloak_auth_required_actions_list` / `keycloak_auth_required_action_set_enabled`
- `keycloak_user_send_action_email` (variant B, if available)
- Credentials list may need Admin REST: `GET .../users/{id}/credentials` (search results often omit credentials)

## Shared prerequisite

Required action must be **registered and enabled** (e.g. `CONFIGURE_TOTP`,
`webauthn-register-passwordless`). Registered-but-disabled accepts API writes and
never prompts.

1. `keycloak_auth_required_actions_list` — check `enabled`.
2. If missing, register via REST `POST .../authentication/register-required-action`, then enable with `keycloak_auth_required_action_set_enabled`.

## Variant A — requiredActions on the user

1. Confirm user has some credential (`GET .../credentials` ≠ `[]`).
2. Read full user (`keycloak_user_get`), merge `requiredActions`, update via MCP/REST **read-merge-write** (user PUT blanks omitted fields).
3. Verify by re-get: `requiredActions` contains the alias.

## Variant B — enrollment email

1. Confirm `emailVerified: true` and SMTP configured. **Do not** mail unverified addresses as a workaround (and do not flip `emailVerified` just to clear the check).
2. `keycloak_user_send_action_email` (or REST execute-actions-email) with the action alias.
3. Decisive check: user completes the link and gains the credential; user still must not gain an unwanted temporary password.

## Traps

- Deciding “has credentials” from `GET /users?username=` — the `credentials` field is often absent; use `/credentials`.
- Sending only `{requiredActions:[...]}` on user PUT — wipes profile fields.
- Leaving the required action registered but disabled.
- Treating email 204 as success for an unverified address when policy should refuse.
