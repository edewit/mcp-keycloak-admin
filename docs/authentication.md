# Authentication tools

Tools for authentication flows and required actions. Built-in flows cannot be
edited in place — copy them first, then bind the copy to a realm flow slot.

## `keycloak_auth_flows_list` [R]

List the realm's authentication flows. No parameters. Returns `id`, `alias`,
`builtIn` (and optional `description` / `topLevel`).

## `keycloak_auth_flow_executions_list` [R]

List executions (steps) for one flow.

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `flowAlias` | string | yes      | Source flow alias. |

## `keycloak_auth_flow_copy` [W]

Copy a flow to a new alias (`POST .../authentication/flows/{alias}/copy`).

| Parameter   | Type   | Required | Description             |
| ----------- | ------ | -------- | ----------------------- |
| `flowAlias` | string | yes      | Source flow alias.      |
| `newName`   | string | yes      | Alias for the new flow. |

## `keycloak_auth_flow_bind` [W]

Bind a flow alias to a realm flow slot via read-merge-write of the realm
representation (avoids blanking omitted fields).

| Parameter   | Type   | Required | Description                                                                                                                                                          |
| ----------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `binding`   | enum   | yes      | One of `browserFlow`, `registrationFlow`, `directGrantFlow`, `resetCredentialsFlow`, `clientAuthenticationFlow`, `dockerAuthenticationFlow`, `firstBrokerLoginFlow`. |
| `flowAlias` | string | yes      | Flow alias to bind.                                                                                                                                                  |

## `keycloak_auth_required_actions_list` [R]

List the realm's required actions. No parameters. Returns `alias`, `name`,
`enabled`, `defaultAction`.

## `keycloak_auth_required_action_set_enabled` [W]

Enable or disable a required action by alias.

| Parameter | Type    | Required | Description                           |
| --------- | ------- | -------- | ------------------------------------- |
| `alias`   | string  | yes      | The required action alias.            |
| `enabled` | boolean | yes      | Whether the action should be enabled. |
