---
name: keycloak
description: >-
  Use when administering a self-managed / local Keycloak realm via MCP
  (mcp-keycloak-admin): OIDC clients, authentication flows, identity providers,
  required actions, SMTP, ACR/LoA, organizations. Triggers: "configure Keycloak",
  "bind browser flow", "add IdP", "set minimum ACR", "create OIDC client",
  "Keycloak realm settings". Not Phase Two hosted clusters. Not app-side login
  code (use securing-apps separately if present).
---

<!-- Local Keycloak admin skill — router only. Procedures live under references/. -->

# Keycloak (local / self-managed)

Detect intent → load **one** reference → use MCP tools → **verify by re-read**.

Requires MCP server `mcp-keycloak-admin` (fork or upstream) pointed at your Keycloak.
Prefer service-account auth. Never delete a realm via improvisation — that tool is out of scope.

## Step 0: Tooling

| Situation                                                                    | Action                                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| MCP tools like `keycloak_client_list` / `keycloak_auth_flows_list` available | Use MCP; fall back to Admin REST only if a recipe step has no tool yet   |
| MCP missing                                                                  | Say so; offer `curl` Admin REST from the recipe, or help wire Cursor MCP |

After every write: call the matching read tool and check the decisive fields. Keycloak realm/client PUT can blank omitted fields — recipes that update realm/client must read-merge-write (the MCP bind/update tools already do this where implemented).

## Step 1: Intent → reference

| Developer wants                                                                             | Intent                          | Read                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| Inspect clients / create or harden an OIDC client (PKCE, redirects, public vs confidential) | **admin:oidc-client**           | `references/admin-oidc-client.md`                                                   |
| List / copy / bind / customize authentication flows                                         | **admin:browser-flow**          | `references/admin-browser-flow.md` (+ `flow-execution-order.md` when editing steps) |
| Passkey-only / WebAuthn passwordless browser login                                          | **admin:passwordless-passkey**  | `references/admin-passwordless-passkey.md`                                          |
| Enroll passkey/TOTP on an existing user                                                     | **admin:credential-enrollment** | `references/admin-credential-enrollment.md`                                         |
| Broker OIDC/SAML or social IdP (button, no domain routing)                                  | **admin:idp-federation**        | `references/admin-idp-federation.md`                                                |
| Corporate SSO by email domain (auto-route, leave others alone)                              | **admin:corporate-sso**         | `references/admin-corporate-sso.md`                                                 |
| Set client/realm ACR ↔ LoA or `minimum.acr.value`                                           | **admin:acr-loa**               | `references/admin-acr-loa.md`                                                       |

### No intent matches

Say the request is not covered yet. Do not invent Admin API shapes. Offer to add a recipe later.

## Step 2: Execute

1. `Read` the single reference file for the intent.
2. Follow its ordered steps and trap notes.
3. Prefer MCP tool names listed in the recipe.
4. Verify with the recipe’s check list before claiming done.
