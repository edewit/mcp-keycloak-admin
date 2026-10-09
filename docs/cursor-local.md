# Cursor + local Keycloak

Point Cursor at this fork (or a built checkout) and a local Keycloak.

## 1. Keycloak client

Follow [setup-keycloak.md](setup-keycloak.md). For flow tools you also need
`manage-realm` (bind/copy) in addition to `view-realm`.

## 2. Cursor MCP config

**Wrong place:** `~/.cursor/skills/.../mcp.json` — skills do not load MCP servers.

**Right places (pick one):**

| Scope               | Path                                                      |
| ------------------- | --------------------------------------------------------- |
| User (all projects) | `~/.cursor/mcp.json`                                      |
| This project only   | `<repo>/.cursor/mcp.json` (gitignored — may hold secrets) |

Example user config:

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

**Restart the agent / Cursor chat** after changing `mcp.json` — MCP servers are
loaded at session start. In Cursor IDE you can also check **Settings → MCP**
and confirm `keycloak` shows as connected.

## 3. Skill pack

Versioned skills live at [`skills/keycloak/`](../skills/keycloak/) (router +
`references/`). For Cursor project discovery, `.cursor/skills/keycloak` symlinks
there (see `.gitignore` exceptions).

User-wide without opening this repo:

```bash
ln -sfn /path/to/mcp-keycloak-admin/skills/keycloak ~/.cursor/skills/keycloak
```
