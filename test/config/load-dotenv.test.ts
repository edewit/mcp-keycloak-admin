import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { applyDotEnvFile } from "../../src/config/load-dotenv.js";

describe("applyDotEnvFile", () => {
  it("loads keys into env when unset", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-kc-dotenv-"));
    const path = join(dir, ".env");
    writeFileSync(
      path,
      [
        "# comment",
        "KEYCLOAK_BASE_URL=http://localhost:8080",
        "AUTH_MODE=password",
        "",
      ].join("\n"),
    );
    const env: NodeJS.ProcessEnv = {};
    applyDotEnvFile(env, path);
    expect(env.KEYCLOAK_BASE_URL).toBe("http://localhost:8080");
    expect(env.AUTH_MODE).toBe("password");
  });

  it("does not override existing env", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-kc-dotenv-"));
    const path = join(dir, ".env");
    writeFileSync(path, "KEYCLOAK_REALM=from-file\n");
    const env: NodeJS.ProcessEnv = { KEYCLOAK_REALM: "from-shell" };
    applyDotEnvFile(env, path);
    expect(env.KEYCLOAK_REALM).toBe("from-shell");
  });

  it("ignores missing file", () => {
    const env: NodeJS.ProcessEnv = {};
    expect(() =>
      applyDotEnvFile(env, join(tmpdir(), "no-such-dotenv-file")),
    ).not.toThrow();
  });
});
