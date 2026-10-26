<!--
  Adapted from "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/admin-corporate-sso.md
   and benchmarks/keycloak-corporate-sso-login REST recipe)
  Licensed under CC BY-SA 4.0. Changes were made: stock Organizations path;
  MCP gaps; concrete Admin REST stages for SkillsBench.
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

- IdP: `keycloak_idp_create` / `_get` / `_list` when MCP exists  
- Organizations / realm flag: **MCP gap** → Admin REST  
- Sandbox: `/root/admin_credentials.txt` + often `/root/corporate_idp_details.txt`

## Steps (Admin REST)

```bash
BASE=…   # e.g. http://localhost:8080/auth
H="Authorization: Bearer $ADMIN_TOKEN"
REALM=acme
```

1. **Enable orgs** — GET realm → set `organizationsEnabled: true` → PUT full representation → confirm it stuck.
2. **Create OIDC IdP** from customer details (`providerId: "oidc"`, endpoints, client id/secret). Prefer `trustEmail: true` so first login is not stalled on email verify.
3. **Create organization** — `POST .../organizations` with name; add customer email domain with `verified: true`.
4. **Link IdP** — `POST .../organizations/{orgId}/identity-providers` with body = JSON string of the IdP alias (bare string, not an object).
5. Confirm browser flow still allows password for non-matching domains (no blanket redirector).

## Verify

- `@customer.example` → IdP (no password form).  
- Internal user → password form.  
- Re-GET: orgs enabled, domain verified, IdP listed under the org.

## Traps

- IdP created but not linked  
- Unverified domain  
- Confusing native Organizations with `keycloak-orgs`  
- “Corporate SSO” that is only a visible IdP button → that is `admin-idp-federation`
