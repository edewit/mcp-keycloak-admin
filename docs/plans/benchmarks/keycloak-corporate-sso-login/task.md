---
schema_version: '1.3'
metadata:
  author_name: Razvan Tufisi
  author_email: rtufisi@phasetwo.io
  difficulty: hard
  difficulty_explanation: >-
    The request is stated the way a customer states it, so the first difficulty
    is recognising what "corporate SSO" means mechanically: route a user to an
    external identity provider chosen from the domain of the email they typed,
    while everyone else still gets a password form. Brokering an OIDC provider
    is the easy half. The hard half is that vanilla Keycloak has exactly one
    way to select a provider by email domain, and it is not in the
    authentication-flow editor where someone would look for it - it needs the
    realm's organization support switched on, an organization holding the
    domain as a *verified* domain, and the identity provider linked to that
    organization. Configure the provider without that link and the login page
    simply shows an SSO button to everybody; mark the domain unverified and
    discovery silently never matches. A redirector execution in a custom flow,
    the obvious-looking answer, sends every user to the provider and breaks
    password login for internal staff.
  category: cybersecurity
  secondary_category: software-engineering
  subcategory: identity-access-management
  category_confidence: high
  task_type:
  - implementation
  modality:
  - json
  interface:
  - terminal
  skill_type:
  - domain-procedure
  - tool-workflow
  tags:
  - keycloak
  - sso
  - identity-brokering
  - oidc
verifier:
  type: test-script
  timeout_sec: 420.0
agent:
  timeout_sec: 1800.0
sandbox:
  network_mode: no-network
  build_timeout_sec: 1800.0
  os: linux
  cpus: 2
  memory_mb: 4096
  storage_mb: 10240
  mcp_servers:
    - name: keycloak
      transport: stdio
      command: node
      args:
        - /opt/mcp-keycloak-admin/dist/index.js
      env:
        KEYCLOAK_BASE_URL: http://localhost:8080/auth
        KEYCLOAK_REALM: acme
        AUTH_MODE: password
        KC_ADMIN_USERNAME: admin
        KC_ADMIN_PASSWORD: admin_change_me
        KC_ADMIN_REALM: master
        READ_ONLY: "false"

---


<!-- Adapted locally for mcp-keycloak-admin skill pack (docs/plans/keycloak-skills). Upstream: https://github.com/p2-inc/keycloak-skills — CC BY-SA 4.0. Skills use our Node mcp-keycloak-admin via ACP sandbox.mcp_servers (stdio); Oracle still uses Admin REST. -->

<!-- Copyright 2026 Phase Two, Inc. -->
<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->

Acme's head of IT has asked for one thing:

> "I want corporate SSO login."

Contoso Ltd is Acme's first enterprise customer. Contoso's staff should reach Acme's portal by signing in with their own company credentials, at their own identity provider — Acme never holds their passwords. Acme's own internal staff must keep signing in with the passwords they already have.

A Keycloak identity server runs at `http://localhost:8080/auth`. It starts with the container and takes a few seconds to come up; `wait-for-services` blocks until it answers. Admin REST API credentials are in `/root/admin_credentials.txt`.

- Realm `acme` is Acme's own realm. It has one browser application registered, the public client `acme-portal`, whose redirect URI is `http://localhost:9999/callback`. It also has one internal account, `dana` / `dana@acme-internal.example`, who signs in with a password.
- Realm `contoso-idp` stands in for Contoso's identity provider, which Contoso operates. The federation details their IT team supplied — endpoints, client ID, client secret, and the email domain their staff use — are in `/root/corporate_idp_details.txt`. Treat that realm as belonging to the customer: do not change anything inside it.

Configure the `acme` realm so that all of the following hold, in a browser authorization-code login against `acme-portal`:

1. Someone who enters an email address at Contoso's domain on Acme's login page is never asked for an Acme password. They are sent to Contoso's identity provider to authenticate.
2. When they authenticate successfully there, they arrive back at `http://localhost:9999/callback` with an authorization code, and the `state` value the application sent is returned unchanged.
3. They then exist as a user in the `acme` realm whose account is linked to that identity provider, holding no password of their own in `acme`.
4. Someone who enters an email address at any other domain — including `dana@acme-internal.example` — is still asked for a password, and can still complete the login with the password they already have.
5. Realm `contoso-idp` is unchanged, and no realm other than `master`, `acme` and `contoso-idp` exists.
