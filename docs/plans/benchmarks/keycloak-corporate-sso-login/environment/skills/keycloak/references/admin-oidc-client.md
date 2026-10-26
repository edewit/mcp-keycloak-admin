# OIDC client (inspect / create / harden)

## Goal

Create or review an OpenID Connect client with safe redirect URIs, correct
public vs confidential settings, and PKCE where appropriate.

## Tools

- `keycloak_client_list`
- `keycloak_client_get`
- `keycloak_client_create` / `keycloak_client_update` (writes)
- `keycloak_client_get_secret` (confidential only; avoid revealing unless needed)

## Steps

1. `keycloak_client_list` — see whether the client already exists.
2. If present: `keycloak_client_get` — note `publicClient`, `redirectUris`, `webOrigins`, standard flow flags.
3. Create or update with the minimum fields required:
   - Public SPA: `publicClient: true`, PKCE S256, exact redirect URIs, no secret.
   - Confidential: `publicClient: false`, service accounts only if needed; keep secret server-side.
4. Re-read with `keycloak_client_get` and confirm every field you care about survived (Keycloak client PUT can blank omitted attributes — prefer the MCP update tool’s documented fields; if you must send a full representation, read-merge-write).

## Traps

- `http://localhost` vs `http://127.0.0.1` are different redirect URIs.
- `webOrigins: ["*"]` with credentials is unsafe; prefer explicit origins.
- Enabling Direct Access Grants on a public client is usually wrong for browser apps.
- Never paste client secrets into chat logs or commit them.

## Verify

`keycloak_client_get` shows the intended redirects, public/confidential flag, and flow toggles.
