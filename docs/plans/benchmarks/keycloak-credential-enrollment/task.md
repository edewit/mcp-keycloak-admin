---
schema_version: '1.3'
metadata:
  author_name: Razvan Tufisi
  author_email: rtufisi@phasetwo.io
  difficulty: medium
  difficulty_explanation: >-
    The mechanism is stock Keycloak with no extension jar, but three things
    fail silently and independently. First, a required action has three
    states that are indistinguishable from the outside - enabled, registered
    but disabled, and not registered at all - and this realm ships
    CONFIGURE_TOTP registered-but-disabled, so setting it on a user is
    accepted by the API and simply never prompts. Second, the two users need
    genuinely different mechanisms for a reason that is a property of the
    users, not a preference: Priya can already authenticate, so a pending
    required action reaches her at next login, while Marcus has no credential
    at all and can only be reached by an action-token email, which in turn
    needs realm SMTP that is deliberately absent. Third, the obvious shortcut
    for Marcus - set him a temporary password and let him log in - satisfies a
    naive reading of the goal while defeating its point, and is the exact
    anti-pattern the task forbids. A third user is credential-less like
    Marcus but has an unverified address and must be left alone - Keycloak
    sends an execute-actions email to an unverified address perfectly
    happily (HTTP 204, message delivered), so that guard exists only if the
    caller writes it, and the field that would identify who holds a
    credential is not returned by a user search at all. Keycloak's user PUT
    also replaces the whole representation, so a partial update silently
    wipes profile fields.
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
  - required-actions
  - credential-enrollment
  - totp
  - mfa
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

Acme is rolling out two-factor authentication. The brief from their IT lead:

> "Everyone moves to an authenticator app. Priya can sort hers out next time she signs in. Marcus just joined and hasn't got any way to sign in yet, so whatever he needs has to be sent to him — and nobody on my team is picking a credential on his behalf. Dana's in the same boat except we've never confirmed her address is really hers, and I'm not having enrollment links go out to an address we haven't checked. Anyone who joins from here on should get asked automatically."

A Keycloak identity server runs at `http://localhost:8080/auth`, serving a realm named `acme` with a public browser client, `acme-portal`. It starts with the container and takes a few seconds to come up; `wait-for-services` blocks until it answers. Admin REST API credentials are in `/root/admin_credentials.txt`.

The two staff accounts differ in a way that matters:

- `priya` (`priya@acme.example`) already signs in with a password.
- `marcus` (`marcus@acme.example`) has no credentials of any kind, and his address is verified.
- `dana` (`dana@acme.example`) has no credentials either, but her address has **not** been verified.

There is no real mail provider here. A local mail-capture server accepts whatever a realm sends and writes each message to `/var/mail-capture/` as one JSON file per message — connection details are in `/root/mail_server_details.txt`.

Configure the `acme` realm so that all of the following hold:

1. The next time `priya` signs in to `acme-portal` with her existing password, she is required to set up a TOTP authenticator before the login completes — she reaches that setup step rather than being returned to the application with an authorization code.
2. `marcus` is sent an email that lets him set up his own TOTP authenticator. No administrator sets or chooses a credential for him: when you are done he must still have no password credential.
3. No enrollment mail goes to an address that has not been verified. `dana` receives nothing at all, and her account is left without a credential rather than worked around.
4. Any user created in this realm from now on is asked to set up a TOTP authenticator as well, without an administrator touching that user.
5. `priya`'s existing password still works unchanged, and every other realm on the server is untouched — no realm other than `master` and `acme` exists.
