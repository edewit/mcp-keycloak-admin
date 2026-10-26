<!--
  Adapted from ideas in "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  Licensed under CC BY-SA 4.0. Changes: mcp-keycloak-admin tools + REST;
  plain broker button (no domain routing / org gate).
-->

# Identity provider federation (OIDC/SAML or social)

## Goal

Add an identity provider so users can broker login from an external IdP — a
**login button anyone can use**, with no email-domain routing and no
organization membership gate. (Domain routing → `admin-corporate-sso`.)

## Tools

- `keycloak_idp_list` / `keycloak_idp_get` / `keycloak_idp_create` / `keycloak_idp_delete`
- `keycloak_idp_mappers_list`
- `keycloak_auth_flows_list` — check first-broker-login binding if relevant
- Sandbox often ships partner IdP details in `/root/contoso_idp_details.txt` (or similar)

## Steps

1. List existing IdPs — avoid duplicate aliases.
2. Create with the correct `providerId` (`oidc`, `saml`, or a social key).
3. Set discovery/metadata or authorization/token/userinfo/jwks URLs; client id/secret for OIDC.
4. Prefer `trustEmail: true` when the partner already verifies email (avoids a verify wall on first broker login).
5. List mappers — email/username/name claims must land on the brokered user. Social providers often need **provider-specific** mapper types (e.g. GitHub `login` → username via `github-user-attribute-mapper`, not a generic OIDC mapper).
6. Confirm first-broker-login flow is appropriate if new users should be created or linked.
7. Do **not** enable organizations / domain linking for this intent — that changes the product into corporate SSO or org-restrict.

## Verify

- `keycloak_idp_get` (or REST GET): `enabled: true`, correct endpoints.
- Browser: partner user completes login with **no** `account_hint` and **no** membership check.
- Partner claims appear on the brokered Keycloak user (`email` / `firstName` / `lastName` as configured).
- Other realms on the server untouched.

## Traps

- Carrying over org-link / `account_hint` checks from a previous corporate-SSO or org-restrict recipe.
- Consumer social “Sign in with Google” ≠ Google Workspace enterprise SAML.
- Domain-based corporate SSO needs Organizations + verified domain + IdP linked to the org.
