<!--
  Adapted from ideas in "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/admin-corporate-sso.md)
  Licensed under CC BY-SA 4.0. Changes were made: split Phase Two keycloak-orgs
  extension path from stock Keycloak Organizations; MCP tool gaps called out.
-->

# Corporate SSO by email domain

## Goal

1. Broker the customer’s IdP
2. Auto-route by email domain
3. Leave everyone else on the normal login

## Do not use

**Identity Provider Redirector** as the answer — it forwards everyone (or only
`kc_idp_hint`), which breaks (3).

## Two different products

| Stack                               | Mechanism                                              | Notes                                                                                           |
| ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Phase Two / `keycloak-orgs` jar** | `ext-auth-home-idp-discovery` + org-linked IdP domains | P2 recipe; APIs under `/realms/{realm}/orgs` — **not** native Organizations                     |
| **Stock Keycloak Organizations**    | Native orgs + domain + IdP link                        | Different API (`/admin/realms/{realm}/organizations`); confirm feature enabled for your version |

If the user has plain Keycloak without either, say domain home-realm discovery
is not available out of the box and stop — do not invent a redirector “fix”.

## Stock path (when Organizations are available)

MCP gap: no org tools yet — use Admin REST, then IdP tools we have.

1. Enable organizations for the realm (version-specific).
2. Create org; add customer email domain as **verified** (unverified often never matches).
3. Create IdP (`keycloak_idp_create` / get) with customer endpoints.
4. Link IdP to the organization (REST) so domain routing applies.
5. Ensure browser flow still allows password for non-matching domains (no blanket redirector).
6. Verify: `@customer.example` → IdP; internal user → password form.

## Phase Two `keycloak-orgs` path

Follow upstream P2 REST doc if that jar is installed. Confirm `/realms/{realm}/orgs`
returns 200 before configuring. Do not set native `organizationsEnabled` expecting
the extension to honor it.

## Traps

- IdP created but not linked → button/route for nobody useful
- Domain on org but not on the link / discovery config → silent no-route
- Confusing native Organizations with `keycloak-orgs`
- “Corporate SSO” that is only a visible IdP button (that’s `admin-idp-federation`)
