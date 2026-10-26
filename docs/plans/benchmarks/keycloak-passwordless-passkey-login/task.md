---
schema_version: '1.3'
metadata:
  author_name: Razvan Tufisi
  author_email: rtufisi@phasetwo.io
  difficulty: hard
  difficulty_explanation: >-
    Unlike magic-link login, passkey-only login has no bootstrap-free path: a
    user with zero credentials cannot "just click a link" the way magic-link's
    anti-enumeration design allows, because registering a WebAuthn credential
    is itself an authenticated action that needs some prior proof of identity.
    The realistic bootstrap is an admin-triggered required-action email (the
    same mail-delivery dependency as magic-link, plus an extra required-action
    wiring step), and the login flow itself must be authored, not just bound -
    Keycloak ships no built-in "passkey only, no password" flow the way it
    ships a built-in magic-link flow, so the default browser flow's username +
    password step must be removed entirely rather than merely deprioritized,
    or a fallback path silently remains. Getting the realm's WebAuthn
    passwordless policy fields wrong (relying party ID mismatched to the
    serving origin, resident-key/user-verification requirements misconfigured)
    produces a ceremony that fails in the browser with no useful server-side
    error, only a generic exception during the client-side crypto exchange.
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
  - passwordless
  - passkey
  - webauthn
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
  storage_mb: 12288
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

Acme's security team has a new requirement:

> "No more passwords. Staff sign in with a passkey, full stop — no password field, ever, for anyone."

A Keycloak identity server runs at `http://localhost:8080/auth`, serving a realm named `acme` with two staff accounts (`priya`, `marcus`) that currently have no credentials of any kind, and a public browser client, `acme-portal`. It starts with the container and takes a few seconds to come up; `wait-for-services` blocks until it answers. Admin REST API credentials are in `/root/admin_credentials.txt`.

There is no real mail provider here. A local mail-capture server accepts whatever a realm sends and writes each message to `/var/mail-capture/` — connection details are in `/root/mail_server_details.txt`.

A headless Chromium browser with WebAuthn support is available at `/root/.cache/ms-playwright` (installed via the `playwright` Python package already present) — anything actually exercising a passkey ceremony (registering one, authenticating with one) needs a browser that can respond to the WebAuthn API, not a plain HTTP client.

Configure the `acme` realm so that all of the following hold, for a browser authorization-code login against `acme-portal`:

1. Neither `priya@acme.example` nor `marcus@acme.example` has a password credential, and the login page for `acme-portal` never shows a password field, under any circumstance — not as a fallback, not as an alternative.
2. Starting from their current (credential-less) state, there is a way to get each of `priya` and `marcus` a registered passkey without ever setting or emailing them a password — the realm's configured mail settings and Keycloak's required-action mechanism are the tools available for this.
3. Once `priya` has a registered passkey, opening the login page for `acme-portal`, entering `priya@acme.example`, and completing the passkey ceremony with the same authenticator that registered it completes the login: the browser arrives back at `http://localhost:9999/callback` with an authorization code, and the `state` value the application sent is returned unchanged.
4. Every other realm on the server is untouched, and no realm other than `master` and `acme` exists.
