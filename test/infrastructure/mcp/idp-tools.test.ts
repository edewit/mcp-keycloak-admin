import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { IdpAlias } from "../../../src/domain/shared/idp-alias.js";
import { buildIdpTools } from "../../../src/infrastructure/mcp/idp-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { InMemoryIdentityProviderRepository } from "../../support/in-memory-identity-provider-repository.js";

const decline: Confirmer = { confirm: () => Promise.resolve(false) };
const decliners: ConfirmerFactory = { create: () => decline };

describe("identity provider tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildIdpTools({
      identityProviderRepository: new InMemoryIdentityProviderRepository(),
      confirmers: decliners,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_idp_list",
      "keycloak_idp_get",
      "keycloak_idp_mappers_list",
    ]);
  });

  it("create handler creates a provider", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    const tools = buildIdpTools({
      identityProviderRepository: repo,
      confirmers: decliners,
    });
    const create = tools.find((tool) => tool.name === "keycloak_idp_create");

    const result = await create!.handler({
      alias: "google",
      providerId: "oidc",
      trustEmail: true,
      displayName: "Google",
      config: { clientId: "x" },
    });

    expect(result.content[0]?.text).toContain("created");
    expect(repo.created[0]?.trustEmail).toBe(true);
    expect(repo.created[0]?.displayName).toBe("Google");
  });

  it("update handler sets trustEmail", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    await repo.create({
      alias: IdpAlias.fromString("google"),
      providerId: "oidc",
      enabled: true,
      config: {},
    });
    const tools = buildIdpTools({
      identityProviderRepository: repo,
      confirmers: decliners,
    });
    const update = tools.find((tool) => tool.name === "keycloak_idp_update");
    const result = await update!.handler({
      alias: "google",
      trustEmail: true,
    });
    expect(result.content[0]?.text).toContain("updated");
    expect(repo.updated[0]?.changes.trustEmail).toBe(true);
  });

  it("delete handler respects a refused confirmation", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    const tools = buildIdpTools({
      identityProviderRepository: repo,
      confirmers: decliners,
    });
    const remove = tools.find((tool) => tool.name === "keycloak_idp_delete");

    const result = await remove!.handler({ alias: "google" });

    expect(result.content[0]?.text).toContain("Not deleted");
    expect(repo.deletedAliases).toHaveLength(0);
  });
});
