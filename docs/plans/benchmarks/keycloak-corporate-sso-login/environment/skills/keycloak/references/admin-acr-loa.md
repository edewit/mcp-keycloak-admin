# ACR / LoA and `minimum.acr.value`

## Goal

Ensure a client enforces a minimum authentication strength (ACR → LoA mapping
and `minimum.acr.value`), and that the grant path you care about actually
honors it (authorization code, device, CIBA).

## Tools (today)

- `keycloak_client_get` / `keycloak_client_update` — client attributes if exposed
- `keycloak_realm_get_config` — limited; may not show ACR maps
- `keycloak_auth_flows_list` — confirm a step-up / LoA-capable browser flow exists

If MCP cannot set `acr.loa.map` or `minimum.acr.value` yet, use Admin REST
read-merge-write on the client representation and say clearly that the MCP gap
exists.

## Correct shape

1. Realm or client attribute `acr.loa.map` JSON, e.g. `{"copper":0,"silver":1,"gold":2}`.
2. Client `minimum.acr.value` (or `default.acr.values`) set to a mapped ACR (e.g. `gold`).
3. Browser (and device/CIBA) flows must be able to reach that LoA (Conditional LoA / OTP step-up).
4. Verify with a real login or integration test — config alone is insufficient.

## Traps

- Setting `minimum.acr.value=gold` **without** an ACR↔LoA map does nothing useful.
- Authorization code can enforce ACR while **device grant** or **CIBA** ignore it if those endpoints never set `REQUESTED_LEVEL_OF_AUTHENTICATION` (fixed in recent Keycloak for device/CIBA — confirm your version).
- Essential `claims` ACR vs non-essential / default ACR use different code paths.

## Verify

Re-read client attributes; then run a login that should stop at OTP (or your LoA step) before tokens are issued. For device grant, token endpoint should return `authorization_pending` until the higher LoA completes.
