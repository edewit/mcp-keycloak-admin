import { describe, expect, it } from "vitest";

import type { EventLog } from "../../../src/domain/ports/event-log.js";
import type { RealmInfo } from "../../../src/domain/ports/realm-info.js";
import type { RealmConfigPatch } from "../../../src/domain/realm/realm-config.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildEventRealmTools } from "../../../src/infrastructure/mcp/event-realm-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";

const eventLog: EventLog = {
  loginEvents: () => Promise.resolve([]),
  adminEvents: () => Promise.resolve([]),
};

function makeRealmInfo(patches: RealmConfigPatch[] = []): RealmInfo {
  return {
    getRealmConfig: () =>
      Promise.resolve({
        realm: "demo-realm",
        enabled: true,
        secret: "x",
        browserFlow: "browser",
        webAuthnPolicyPasswordlessRpId: "localhost",
        smtpServer: {
          host: "mail",
          from: "noreply@example.com",
          password: "s3cret",
        },
      }),
    updateRealmConfig: (patch) => {
      patches.push(patch);
      return Promise.resolve();
    },
    serverInfo: () => Promise.resolve({ systemInfo: { version: "26.0.5" } }),
  };
}

describe("event & realm tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildEventRealmTools({
      eventLog,
      realmInfo: makeRealmInfo(),
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_events_login",
      "keycloak_events_admin",
      "keycloak_realm_get_config",
      "keycloak_server_info",
    ]);
  });

  it("realm config tool returns curated fields and redacted smtp", async () => {
    const tools = buildEventRealmTools({
      eventLog,
      realmInfo: makeRealmInfo(),
    });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_realm_get_config",
    );
    const result = await tool!.handler({});
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("demo-realm");
    expect(text).toContain("localhost");
    expect(text).toContain('"hasPassword": true');
    expect(text).not.toContain("s3cret");
    expect(text).not.toContain("secret");
  });

  it("realm update tool merges smtp and passwordless policy", async () => {
    const patches: RealmConfigPatch[] = [];
    const tools = buildEventRealmTools({
      eventLog,
      realmInfo: makeRealmInfo(patches),
    });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_realm_update",
    );
    const result = await tool!.handler({
      smtpServer: { host: "smtp", from: "a@b.c", auth: false },
      webAuthnPasswordlessPolicy: {
        rpId: "localhost",
        requireResidentKey: "Yes",
      },
    });
    expect(result.content[0]?.text).toContain("smtpServer");
    expect(result.content[0]?.text).toContain("webAuthnPasswordlessPolicy");
    expect(patches[0]?.smtpServer?.host).toBe("smtp");
    expect(patches[0]?.webAuthnPasswordlessPolicy?.rpId).toBe("localhost");
  });

  it("realm update tool sets organizationsEnabled", async () => {
    const patches: RealmConfigPatch[] = [];
    const tools = buildEventRealmTools({
      eventLog,
      realmInfo: makeRealmInfo(patches),
    });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_realm_update",
    );
    const result = await tool!.handler({ organizationsEnabled: true });
    expect(result.content[0]?.text).toContain("organizationsEnabled");
    expect(patches[0]?.organizationsEnabled).toBe(true);
  });

  it("server info tool returns the Keycloak version", async () => {
    const tools = buildEventRealmTools({
      eventLog,
      realmInfo: makeRealmInfo(),
    });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_server_info",
    );
    const result = await tool!.handler({});
    expect(result.content[0]?.text).toContain("26.0.5");
  });
});
