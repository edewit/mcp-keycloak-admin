# Organization tools

Stock Keycloak Organizations (domain-based home IdP discovery). Enable the
feature with `keycloak_realm_update` (`organizationsEnabled: true`) before
creating organizations.

## `keycloak_org_list` [R]

List organizations in the realm. No parameters. Returns `id`, `name`, `alias`,
`enabled`, `description`, and `domains` (`name` + `verified`).

## `keycloak_org_get` [R]

Fetch one organization by UUID.

| Parameter        | Type   | Required | Description        |
| ---------------- | ------ | -------- | ------------------ |
| `organizationId` | string | yes      | Organization UUID. |

## `keycloak_org_create` [W]

Create an organization with at least one email domain. Domains used for
corporate SSO must have `verified: true` (the default).

| Parameter     | Type    | Required | Description                           |
| ------------- | ------- | -------- | ------------------------------------- |
| `name`        | string  | yes      | Display name (also default alias).    |
| `domains`     | array   | yes      | `{ name, verified? }` — at least one. |
| `alias`       | string  | no       | Defaults to `name`.                   |
| `description` | string  | no       | Optional description.                 |
| `enabled`     | boolean | no       | Defaults to `true`.                   |

Returns the created organization JSON (including `id`).

## `keycloak_org_delete` [D]

Delete an organization. **Destructive** — requires confirmation. Removes
domains and IdP links.

| Parameter        | Type    | Required | Description                    |
| ---------------- | ------- | -------- | ------------------------------ |
| `organizationId` | string  | yes      | Organization UUID.             |
| `confirm`        | boolean | no       | Elicitation fallback approval. |

## `keycloak_org_idp_list` [R]

List IdP aliases linked to an organization.

| Parameter        | Type   | Required | Description        |
| ---------------- | ------ | -------- | ------------------ |
| `organizationId` | string | yes      | Organization UUID. |

## `keycloak_org_idp_link` [W]

Link an existing identity provider to an organization (required for
email-domain routing). Create the IdP with `keycloak_idp_create` first.

| Parameter        | Type   | Required | Description        |
| ---------------- | ------ | -------- | ------------------ |
| `organizationId` | string | yes      | Organization UUID. |
| `idpAlias`       | string | yes      | IdP alias to link. |

## `keycloak_org_idp_unlink` [D]

Unlink an IdP from an organization. **Destructive** — requires confirmation.
The IdP remains in the realm.

| Parameter        | Type    | Required | Description                    |
| ---------------- | ------- | -------- | ------------------------------ |
| `organizationId` | string  | yes      | Organization UUID.             |
| `idpAlias`       | string  | yes      | IdP alias to unlink.           |
| `confirm`        | boolean | no       | Elicitation fallback approval. |
