# Bind / customize a browser authentication flow

## Goal

Change which authentication flow the realm uses for browser logins, or customize
steps on a **copy** of a built-in flow.

## Tools

- `keycloak_auth_flows_list`
- `keycloak_auth_flow_executions_list`
- `keycloak_auth_authenticator_providers_list`
- `keycloak_auth_flow_copy` (write)
- `keycloak_auth_flow_bind` (write)
- `keycloak_auth_flow_execution_add` / `_update` / `_raise_priority` / `_lower_priority` (write)
- `keycloak_auth_flow_execution_delete` (destructive — prefer DISABLED)
- `keycloak_realm_get_config` (limited verify)

## Steps

1. `keycloak_auth_flows_list` — note current browser flow and `builtIn`.
2. `keycloak_auth_flow_executions_list` — understand steps/requirements.
3. If changing a **built-in** flow:
   - `keycloak_auth_flow_copy` (`flowAlias: "browser"`, new name e.g. `browser-custom`).
4. Customize the copy:
   - `keycloak_auth_authenticator_providers_list` for valid `providerId`s.
   - `keycloak_auth_flow_execution_add` on the copy or a nested sub-flow alias.
   - `keycloak_auth_flow_execution_update` to set `REQUIRED` / `ALTERNATIVE` / `DISABLED`.
   - Raise/lower priority to reorder.
5. `keycloak_auth_flow_bind` with `binding: "browserFlow"` and the custom alias.
6. Verify: re-list executions; smoke-test a login.

## Traps

- **Never edit built-in flows in place** — always copy first.
- **Realm PUT blanking** — use `keycloak_auth_flow_bind` (read-merge-write), not a raw partial realm PUT.
- Binding the wrong slot (`firstBrokerLoginFlow` vs `browserFlow`) leaves browser login unchanged.
- Adding an execution to the top-level browser flow vs the nested `… forms` sub-flow produces different UX; list executions and pick the right `flowAlias`.
- Prefer `requirement: DISABLED` over delete when experimenting.
- Execution `requirement` and order are load-bearing; wrong values break login.

## Stop

Creating nested sub-flows (new flow nodes) may still need Admin REST if no MCP
tool exists yet — say so rather than inventing payloads.
