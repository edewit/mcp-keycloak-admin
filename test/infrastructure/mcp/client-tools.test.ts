import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildClientTools } from "../../../src/infrastructure/mcp/client-tools.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { aClient } from "../../support/clients.js";
import { InMemoryAuthenticationRepository } from "../../support/in-memory-authentication-repository.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const confirmers: ConfirmerFactory = { create: () => approve };
const authenticationRepository = new InMemoryAuthenticationRepository([
  { id: "flow-passkey", alias: "Passkey Only", builtIn: false },
]);

describe("client tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildClientTools({
      clientRepository: new InMemoryClientRepository(),
      authenticationRepository,
      confirmers,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_client_list",
      "keycloak_client_get",
      "keycloak_client_get_secret",
    ]);
  });

  it("masks the secret unless reveal is true", async () => {
    const repo = new InMemoryClientRepository([aClient("mcp-admin", UUID)], {
      [UUID]: "s3cr3t",
    });
    const tools = buildClientTools({
      clientRepository: repo,
      authenticationRepository,
      confirmers,
    });
    const secretTool = tools.find(
      (tool) => tool.name === "keycloak_client_get_secret",
    );

    const masked = await secretTool!.handler({ clientId: "mcp-admin" });
    const revealed = await secretTool!.handler({
      clientId: "mcp-admin",
      reveal: true,
    });

    expect(masked.content[0]?.text).not.toContain("s3cr3t");
    expect(revealed.content[0]?.text).toBe("s3cr3t");
  });

  it("binds a browser flow alias to the client override", async () => {
    const repo = new InMemoryClientRepository([aClient("portal", UUID)]);
    const tools = buildClientTools({
      clientRepository: repo,
      authenticationRepository,
      confirmers,
    });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_client_update",
    );
    const result = await tool!.handler({
      clientId: "portal",
      browserFlowAlias: "Passkey Only",
      minimumAcrValue: "gold",
    });
    expect(result.content[0]?.text).toContain("updated");
    expect(repo.updated[0]?.changes.authenticationFlowBindingOverrides).toEqual(
      { browser: "flow-passkey" },
    );
    expect(repo.updated[0]?.changes.attributes).toEqual({
      "minimum.acr.value": "gold",
    });
  });
});
