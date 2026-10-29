# ACR / LoA and `minimum.acr.value`

## Goal

Ensure a client enforces a minimum authentication strength (ACR → LoA mapping
and `minimum.acr.value`), and that the grant path you care about actually
honors it (authorization code, device, CIBA).

## Tools

- `keycloak_realm_update` with `acrLoaMap` → verify `keycloak_realm_get_config` (`acrLoaMap`)
- `keycloak_client_update` with `minimumAcrValue` (and optional client-level `attributes["acr.loa.map"]`) → verify `keycloak_client_get`
- `keycloak_auth_flows_list` — confirm a step-up / LoA-capable browser flow exists

## Steps

1. **Map ACR → LoA** on the realm:
   `keycloak_realm_update` with e.g. `acrLoaMap: { "copper": 0, "silver": 1, "gold": 2 }`.
2. **Require a minimum ACR** on the client:
   `keycloak_client_update` with `minimumAcrValue: "gold"` (or
   `attributes: { "minimum.acr.value": "gold" }`).
3. Ensure browser (and device/CIBA) flows can reach that LoA (Conditional LoA /
   OTP step-up) — customize via auth flow tools if needed.
4. Verify with a real login or integration test — config alone is insufficient.

## Correct shape

1. Realm or client attribute `acr.loa.map` JSON, e.g. `{"copper":0,"silver":1,"gold":2}`.
2. Client `minimum.acr.value` (or `default.acr.values`) set to a mapped ACR (e.g. `gold`).
3. Browser (and device/CIBA) flows must be able to reach that LoA.
4. Re-read client attributes and realm `acrLoaMap`; then run a login that should stop at OTP (or your LoA step) before tokens are issued.

## Traps

- Setting `minimum.acr.value=gold` **without** an ACR↔LoA map does nothing useful.
- Authorization code can enforce ACR while **device grant** or **CIBA** ignore it if those endpoints never set `REQUESTED_LEVEL_OF_AUTHENTICATION` (fixed in recent Keycloak for device/CIBA — confirm your version).
- Essential `claims` ACR vs non-essential / default ACR use different code paths.
