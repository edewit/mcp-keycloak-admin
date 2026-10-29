<!--
  Adapted from "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/admin-corporate-sso.md
   and benchmarks/keycloak-corporate-sso-login REST recipe)
  Licensed under CC BY-SA 4.0. Changes were made: stock Organizations path;
  MCP tool preference; concrete stages for SkillsBench.
-->

# Corporate SSO by email domain

## Goal

1. Broker the customer’s IdP  
2. Auto-route by email domain  
3. Leave everyone else on the normal login  

## Do not use

**Identity Provider Redirector** — forwards everyone (or only `kc_idp_hint`), which breaks (3).

## Mechanism (stock Keycloak Organizations)

| Missing | Symptom |
| --- | --- |
| `organizationsEnabled` false | No domain routing |
| Org domain not **verified** | Stored but never matches |
| IdP not **linked** to the org | SSO button for everyone, no auto-route |

Phase Two `keycloak-orgs` (`/realms/{realm}/orgs`, `ext-auth-home-idp-discovery`) is a different product — only use if that jar is present.

## Tools

Prefer MCP (when attached):

- Realm flag: `keycloak_realm_update` (`organizationsEnabled: true`) → verify `keycloak_realm_get_config`
- IdP: `keycloak_idp_create` / `_update` / `_get` / `_list` (set `trustEmail: true`)
- Org: `keycloak_org_create` / `_get` / `_list`
- Link: `keycloak_org_idp_link` → verify `keycloak_org_idp_list`

Sandbox credentials: `/root/admin_credentials.txt` + often `/root/corporate_idp_details.txt`.

## Steps

1. **Enable orgs** — `keycloak_realm_update` with `organizationsEnabled: true` → confirm via `keycloak_realm_get_config`.
2. **Create OIDC IdP** — `keycloak_idp_create` from customer details (`providerId: "oidc"`, endpoints, client id/secret) with `trustEmail: true` so first login is not stalled on email verify. Use `keycloak_idp_update` to adjust flags/config without recreating.
3. **Create organization** — `keycloak_org_create` with `name` and `domains: [{ name: "<customer-domain>", verified: true }]`. Keep the returned `id`.
4. **Link IdP** — `keycloak_org_idp_link` with `organizationId` and `idpAlias`. Confirm with `keycloak_org_idp_list`.
5. Confirm browser flow still allows password for non-matching domains (no blanket redirector).

## Verify

- `@customer.example` → IdP (no password form).  
- Internal user → password form.  
- Re-read: `organizationsEnabled`, domain verified on the org, IdP listed under the org, `trustEmail` true on the IdP.

## Traps

- IdP created but not linked  
- Unverified domain  
- Confusing native Organizations with `keycloak-orgs`  
- “Corporate SSO” that is only a visible IdP button → that is `admin-idp-federation`
