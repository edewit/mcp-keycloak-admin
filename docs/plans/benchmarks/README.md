# Local Keycloak skill benchmarks

Adapted from [p2-inc/keycloak-skills](https://github.com/p2-inc/keycloak-skills)
`benchmarks/` (CC BY-SA 4.0 for task text; Apache-2.0 for harness code). Kept under
gitignored `docs/plans/` — not part of upstream PR #36.

Each task keeps Phase Two’s sandbox, oracle, and adversarial verifier. The skill
under test is **ours**: `environment/skills/keycloak/` (copied from
`../keycloak-skills/`).

## Tasks (skills we have today)

| Task | Skill intent | Stock Keycloak? |
| --- | --- | --- |
| `keycloak-passwordless-passkey-login` | `admin:passwordless-passkey` (+ enrollment) | Yes |
| `keycloak-credential-enrollment` | `admin:credential-enrollment` | Yes |
| `keycloak-idp-federation-login` | `admin:idp-federation` | Yes |
| `keycloak-corporate-sso-login` | `admin:corporate-sso` | Yes (native Organizations) |

Not adapted (need P2 extensions, app skills, or recipes we don’t have yet):
magic-link, email-OTP, org-restrict, zero-password, social, IdP-initiated SSO,
`securing-apps` tasks.

## Changes from upstream

- Replaced per-task `…Mcp` / `…Rest` skills with our router + `references/`.
- Wired **our** Node `mcp-keycloak-admin` into each image and declared it in
  `task.md` as `sandbox.mcp_servers` (stdio → ACP `session/new`). Agents with
  skills should call `keycloak_*` tools; the oracle still uses Admin REST.
- P2’s private Quarkus MCP jar remains optional/empty; not required.
- Added adaptation notice in each `task.md`.

## Sync skill + MCP copies

After editing `docs/plans/keycloak-skills/` or rebuilding the MCP server:

```bash
npm run build   # from repo root — required for dist/
./docs/plans/benchmarks/sync-skills.sh
```

That refreshes `environment/skills/keycloak/` and stages
`environment/mcp-keycloak-admin/` (`package.json`, lockfile, `dist/`) for Docker.

## Run with SkillsBench / BenchFlow

```bash
# once
uv tool install benchflow

# validate packaging
bench tasks check docs/plans/benchmarks/keycloak-passwordless-passkey-login

# oracle must pass (no agent) — proves sandbox + verifier
bench eval run \
  --tasks-dir docs/plans/benchmarks/keycloak-passwordless-passkey-login \
  --agent oracle \
  --sandbox docker

# agent with our skills
bench eval run \
  --tasks-dir docs/plans/benchmarks/keycloak-passwordless-passkey-login \
  --agent claude-agent-acp \
  --model <model> \
  --skill-mode with-skill \
  --skills-dir docs/plans/benchmarks/keycloak-passwordless-passkey-login/environment/skills/ \
  --sandbox docker
```

First Docker builds pull Keycloak + (for passkey) Playwright Chromium — slow and large.
Need API keys for non-oracle agents (`ANTHROPIC_API_KEY`, etc.).

### Fedora / Podman

BenchFlow shells out to `docker` and Docker Compose **v2** (`docker compose
--project-directory …`). Plain `podman-compose` does not accept that CLI.

```bash
sudo dnf install -y podman-docker docker-compose
systemctl --user enable --now podman.socket
export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock

# Prefer the official Compose plugin over podman-compose:
mkdir -p ~/.config/containers
cat >> ~/.config/containers/containers.conf <<'EOF'
[engine]
compose_providers = ["/usr/libexec/docker/cli-plugins/docker-compose"]
compose_warning_logs = false
EOF

docker compose version   # Docker Compose version 5.x
```

Optional: `sudo touch /etc/containers/nodocker` to silence the emulate-Docker banner.

## Attribution

Contains material from "keycloak-skills" by Phase Two, Inc.
https://github.com/p2-inc/keycloak-skills
Licensed under CC BY-SA 4.0 (task/skill markdown) and Apache-2.0 (scripts/Docker).
Adaptations: local skill pack injection; MCP fixture removed; paths under `docs/plans/`.
