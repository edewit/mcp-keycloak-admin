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
- IdP: `keycloak_idp_create` / `_get` / `_list`
- Org: `keycloak_org_create` / `_get` / `_list`
- Link: `keycloak_org_idp_link` → verify `keycloak_org_idp_list`

Sandbox credentials: `/root/admin_credentials.txt` + often `/root/corporate_idp_details.txt`.

## Steps

1. **Enable orgs** — `keycloak_realm_update` with `organizationsEnabled: true` → confirm via `keycloak_realm_get_config`.
2. **Create OIDC IdP** — `keycloak_idp_create` from customer details (`providerId: "oidc"`, endpoints, client id/secret). Prefer `trustEmail` in config when the customer vouches for emails (`"trustEmail": "true"` if the tool config map is stringly; otherwise create via REST with boolean `trustEmail: true` if MCP config cannot set top-level IdP flags).
3. **Create organization** — `keycloak_org_create` with `name` and `domains: [{ name: "<customer-domain>", verified: true }]`. Keep the returned `id`.
4. **Link IdP** — `keycloak_org_idp_link` with `organizationId` and `idpAlias`. Confirm with `keycloak_org_idp_list`.
5. Confirm browser flow still allows password for non-matching domains (no blanket redirector).

### Admin REST fallback (MCP gap / no tools)

```bash
BASE=…   # e.g. http://localhost:8080/auth
H="Authorization: Bearer $ADMIN_TOKEN"
REALM=acme
```

1. GET realm → set `organizationsEnabled: true` → PUT full representation.
2. `POST .../identity-provider/instances` for the OIDC IdP.
3. `POST .../organizations` with name + `domains: [{ name, verified: true }]`.
4. `POST .../organizations/{orgId}/identity-providers` with body = JSON string of the IdP alias (bare string, not an object).

## Verify

- `@customer.example` → IdP (no password form).  
- Internal user → password form.  
- Re-read: `organizationsEnabled`, domain verified on the org, IdP listed under the org.

## Traps

- IdP created but not linked  
- Unverified domain  
- Confusing native Organizations with `keycloak-orgs`  
- “Corporate SSO” that is only a visible IdP button → that is `admin-idp-federation`
