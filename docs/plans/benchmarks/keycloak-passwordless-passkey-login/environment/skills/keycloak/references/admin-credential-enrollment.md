<!--
  Adapted from "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/admin-credential-enrollment.md
   and passkey REST bootstrap stages)
  Licensed under CC BY-SA 4.0. Changes were made: mcp-keycloak-admin tools,
  concrete Admin REST, sandbox stop rules.
-->

# Enroll a credential on an existing user

Passwordless / step-up flows fail silently if **no user has the credential**.
Pick the variant from facts about the user, not preference.

| | A — required action on next login | B — execute-actions email |
| --- | --- | --- |
| Prerequisite | User can already authenticate | Realm SMTP + **verified** email |
| Zero-credential user? | No | Yes |
| SMTP needed? | No | Yes |

For passkey-only bootstrap use action alias **`webauthn-register-passwordless`**
(variant B). See `admin-passwordless-passkey.md`.

## Stop rule

Configure required actions + send (or set) enrollment. **Do not** complete the
WebAuthn/TOTP ceremony yourself in a sandbox unless you already have a working
browser + virtual authenticator as the same user. Verifiers often own that step.
Never set a temporary password to fake enrollment for passwordless intents.

## Tools

- `keycloak_user_search` / `keycloak_user_get`
- `keycloak_user_credentials_list` — search/get omit credentials; empty array ⇒ zero-credential
- `keycloak_auth_required_actions_list` / `keycloak_auth_required_action_set_enabled`
- `keycloak_user_send_action_email` (variant B)
- `keycloak_realm_update` for SMTP when using variant B

## Shared prerequisite

Required action must be **registered and enabled**. Registered-but-disabled
accepts API writes and never prompts (`CONFIGURE_TOTP` often ships this way).

```bash
# list
curl -s "$BASE/admin/realms/$REALM/authentication/required-actions" -H "$H"

# register if missing (providerId/alias depend on the action)
curl -s -X POST "$BASE/admin/realms/$REALM/authentication/register-required-action" -H "$H" \
  -H 'Content-Type: application/json' \
  -d '{"providerId":"webauthn-register-passwordless","name":"Webauthn Register Passwordless"}'

# enable — GET the action, set "enabled": true, PUT back (read-merge-write)
curl -s -X PUT "$BASE/admin/realms/$REALM/authentication/required-actions/webauthn-register-passwordless" \
  -H "$H" -H 'Content-Type: application/json' --data-binary @/tmp/ra.json
```

MCP: list + `keycloak_auth_required_action_set_enabled` when available.

## Variant A — requiredActions on the user

1. Confirm user has some credential (`keycloak_user_credentials_list` ≠ `[]`).
2. Read full user, merge `requiredActions`, update **read-merge-write** (MCP `keycloak_user_update` does not yet set requiredActions — use Admin REST for that merge if needed).
3. Re-get: `requiredActions` contains the alias.

## Variant B — enrollment email (zero-credential / passkey bootstrap)

1. Confirm `emailVerified: true`. **Do not** flip verification to clear the check.
2. Realm SMTP configured (read-merge-write `smtpServer` on the realm). Verify mail
   actually leaves (capture dir / real provider) — send failures are often silent.
3. Send:

```bash
curl -s -X PUT "$BASE/admin/realms/$REALM/users/<user-id>/execute-actions-email\
?client_id=<client-id>&redirect_uri=<url-encoded-redirect>" \
  -H "$H" -H 'Content-Type: application/json' \
  -d '["webauthn-register-passwordless"]'
```

4. Config-level success: mail captured / delivered; user still has **no password**
   credential. Ceremony completion is verifier/human territory unless you have a
   proper browser harness.

## Traps

- Deciding “has credentials” from user search/get — use `keycloak_user_credentials_list`.
- Sending only `{requiredActions:[...]}` on user PUT — wipes profile fields.
- Leaving the required action registered but disabled.
- Treating email 204 as success for an unverified address when policy should refuse.
- Setting a temporary password to “bootstrap” passwordless — fails the intent.
- Digging into Keycloak’s H2 DB or forging WebAuthn attestations instead of SMTP + execute-actions-email.
