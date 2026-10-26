---
name: keycloak
description: >-
  Use when administering a self-managed / local Keycloak realm via Admin REST
  or mcp-keycloak-admin: OIDC clients, authentication flows, identity providers,
  required actions, SMTP, ACR/LoA, organizations. Triggers: "configure Keycloak",
  "bind browser flow", "add IdP", "set minimum ACR", "create OIDC client",
  "Keycloak realm settings", "passkey-only login", "corporate SSO",
  "credential enrollment". Not Phase Two hosted clusters. Not app-side login
  code (use securing-apps separately if present).
---

<!-- Local Keycloak admin skill — router only. Procedures live under references/. -->

# Keycloak (local / self-managed)

Detect intent → load **one** reference → use MCP tools → **verify by re-read**.

Never delete a realm via improvisation — that tool is out of scope.

## Step 0: Tooling

1. Run `wait-for-services` if present (Keycloak / mail must be up before tools).
2. Prefer MCP tools named `keycloak_*` (in SkillsBench they are attached as the
   `keycloak` ACP MCP server; in Cursor they come from mcp-keycloak-admin).
3. Use Admin REST only for a step the recipe marks as an **MCP gap**, or when
   no MCP tools are attached at all. Credentials live in
   `/root/admin_credentials.txt` (and mail details if present). Do not invent
   ports or dig through `/proc`.

After every write: re-read and check the decisive fields. Realm/client/user PUT can blank omitted fields — always read-merge-write.

**Sandbox stop rule:** finish **configuration** (policy, flows, bind, SMTP, enrollment emails). Do **not** forge WebAuthn, dig into H2, or chase root-only Playwright caches — verifiers drive browser ceremonies.

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
