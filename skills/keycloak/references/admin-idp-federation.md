# Identity provider federation (OIDC/SAML or social)

## Goal

Add an identity provider so users can broker login from an external IdP.

## Tools

- `keycloak_idp_list` / `keycloak_idp_get`
- `keycloak_idp_create` / `keycloak_idp_delete`
- `keycloak_idp_mappers_list`
- `keycloak_auth_flows_list` — check `first broker login` binding if relevant

## Steps

1. List existing IdPs — avoid duplicate aliases.
2. Create with the correct provider id (`oidc`, `saml`, or a social provider key).
3. Set discovery/metadata or authorization/token/userinfo URLs; client id/secret for OIDC.
4. List mappers — ensure email/username claims map as intended (social providers often need provider-specific mapper types).
5. Confirm first-broker-login flow is appropriate if new users should be created or linked.

## Traps

- Consumer social “Sign in with Google” ≠ Google Workspace enterprise SAML.
- Domain-based corporate SSO needs **organizations** + verified domain + IdP linked to the org — a plain IdP button is not home-realm discovery.
- Trust email from IdP only when appropriate; otherwise account linking surprises users.

## Verify

`keycloak_idp_get` shows enabled=true and correct endpoints; optional browser login through the IdP button.
