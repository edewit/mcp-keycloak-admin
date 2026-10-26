# Cursor + local Keycloak

Point Cursor at **this fork** ([edewit/mcp-keycloak-admin](https://github.com/edewit/mcp-keycloak-admin))
and a local Keycloak. Prefer `main` — it includes auth-flow mutation, realm
SMTP/WebAuthn updates, and the skill/benchmark pack under `docs/plans/`.

## 1. Keycloak client

Follow [setup-keycloak.md](setup-keycloak.md). For flow and realm tools you need
`manage-realm` (and usually `view-realm`) in addition to user/client roles.

## 2. Build and Cursor MCP config

```bash
git clone https://github.com/edewit/mcp-keycloak-admin.git
cd mcp-keycloak-admin
npm install && npm run build
```

User or project `mcp.json` (adjust the path):

```json
{
  "mcpServers": {
    "keycloak": {
      "command": "node",
      "args": ["/home/edewit/workspace/mcp-keycloak-admin/dist/index.js"],
      "env": {
        "KEYCLOAK_BASE_URL": "http://localhost:8080",
        "KEYCLOAK_REALM": "master",
        "AUTH_MODE": "password",
        "KC_ADMIN_USERNAME": "admin",
        "KC_ADMIN_PASSWORD": "admin",
        "KC_ADMIN_REALM": "master",
        "READ_ONLY": "false"
      }
    }
  }
}
```

Prefer `AUTH_MODE=service_account` with `KC_CLIENT_ID` / `KC_CLIENT_SECRET` once
the `mcp-admin` client exists.

Rebuild after pulling: `npm run build`.

Published `npx mcp-keycloak-admin` still tracks the upstream npm package and may
lag this fork until you publish from here.

## 3. Skill pack

Install the skill from this repo:

```bash
mkdir -p ~/.cursor/skills
ln -sfn "$(pwd)/docs/plans/keycloak-skills" ~/.cursor/skills/keycloak
```

The skill (`SKILL.md` + `references/`) tells the agent which `keycloak_*` MCP
tools to call for common admin intents (passkeys, IdP, enrollment, …).

## 4. More

- Resume / roadmap notes: [plans/STATUS.md](plans/STATUS.md)
- SkillsBench tasks: [plans/benchmarks/README.md](plans/benchmarks/README.md)
