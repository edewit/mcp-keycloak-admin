<!--
  Adapted from "keycloak-skills" by Phase Two, Inc.
  https://github.com/p2-inc/keycloak-skills
  (plugins/phasetwo/skills/keycloak/references/flow-execution-order.md)
  Licensed under CC BY-SA 4.0. Changes were made: condensed for stock Keycloak
  and mcp-keycloak-admin verify loops.
-->

# Authentication flow shape and execution order

Read alongside any recipe that authors or edits a flow.

## Two silent failure modes

1. **Wrong shape** — step is in the wrong sibling set; the engine discards it.
2. **Wrong order** — right shape, wrong sequence among siblings.

Shape first. Ordering fixes on a mis-shaped level are wasted.

## Shape: each level must be bucket-pure

Among **direct children of one flow**, Keycloak buckets:

| Requirement               | Bucket      |
| ------------------------- | ----------- |
| `REQUIRED`, `CONDITIONAL` | required    |
| `ALTERNATIVE`             | alternative |
| `DISABLED`                | neither     |

If **any** required-bucket child exists at that level, the **entire alternative
bucket is cleared**. So never put a bare `REQUIRED` authenticator next to an
`ALTERNATIVE` cookie (or other alternative) at the same level — wrap the
required work in an `ALTERNATIVE` **sub-flow** instead.

## Order: create ≠ runtime order

Treat `priority` on create as a request. Always:

1. `keycloak_auth_flow_executions_list`
2. Repair with raise/lower priority tools (or REST) until the list matches the recipe
3. Only then bind the flow

## Verify

Never assume the admin console screenshot or the create call order. Re-list
executions after every mutation.
