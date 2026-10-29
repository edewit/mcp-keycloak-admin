# Identity provider tools

## `keycloak_idp_list` [R]

List the realm's identity providers. No parameters. Returns `alias`,
`providerId`, `enabled`, `displayName`, `trustEmail`.

## `keycloak_idp_get` [R]

Fetch an identity provider by alias.

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| `alias`   | string | yes      | The provider's alias. |

## `keycloak_idp_mappers_list` [R]

List an identity provider's mappers (`id`, `name`, `type`).

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| `alias`   | string | yes      | The provider's alias. |

## `keycloak_idp_create` [W]

Create an identity provider. `config` carries provider-specific keys
(`clientId`, `clientSecret`, `authorizationUrl`, …).

| Parameter     | Type    | Required | Description                                                   |
| ------------- | ------- | -------- | ------------------------------------------------------------- |
| `alias`       | string  | yes      | The provider's alias.                                         |
| `providerId`  | string  | yes      | e.g. `oidc`, `saml`, `google`.                                |
| `enabled`     | boolean | no       | Defaults to `true`.                                           |
| `displayName` | string  | no       | Login-page label.                                             |
| `trustEmail`  | boolean | no       | Trust IdP emails without verify (prefer `true` for corp SSO). |
| `config`      | object  | no       | String key/value provider settings.                           |

## `keycloak_idp_update` [W]

Read-merge-write an existing identity provider (enabled / displayName /
trustEmail / config merge). Prefer this over delete+create.

| Parameter     | Type    | Required | Description                       |
| ------------- | ------- | -------- | --------------------------------- |
| `alias`       | string  | yes      | The provider's alias.             |
| `enabled`     | boolean | no       |                                   |
| `displayName` | string  | no       |                                   |
| `trustEmail`  | boolean | no       |                                   |
| `config`      | object  | no       | Keys merged into existing config. |

## `keycloak_idp_delete` [D]

Delete an identity provider. **Destructive** — requires confirmation. Users who
authenticate through it can no longer log in via that provider.

| Parameter | Type    | Required | Description                    |
| --------- | ------- | -------- | ------------------------------ |
| `alias`   | string  | yes      | The provider's alias.          |
| `confirm` | boolean | no       | Elicitation fallback approval. |
