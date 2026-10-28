import { describe, expect, it } from "vitest";

import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { OrganizationId } from "../../../src/domain/shared/organization-id.js";
import { buildOrgTools } from "../../../src/infrastructure/mcp/org-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { InMemoryOrganizationRepository } from "../../support/in-memory-organization-repository.js";

const confirmers: ConfirmerFactory = {
  create: (providedConfirm) => ({
    confirm: () => Promise.resolve(providedConfirm),
  }),
};

const ORG_ID = "11111111-1111-4111-8111-111111111111";

describe("org tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildOrgTools({
      organizationRepository: new InMemoryOrganizationRepository(),
      confirmers,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_org_list",
      "keycloak_org_get",
      "keycloak_org_idp_list",
    ]);
  });

  it("creates an organization with verified domains", async () => {
    const repo = new InMemoryOrganizationRepository();
    const tools = buildOrgTools({ organizationRepository: repo, confirmers });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_org_create",
    );
    const result = await tool!.handler({
      name: "contoso",
      domains: [{ name: "contoso.com" }],
    });
    expect(repo.created[0]?.name).toBe("contoso");
    expect(repo.created[0]?.domains[0]?.verified).toBe(true);
    expect(result.content[0]?.text).toContain("contoso.com");
  });

  it("links and lists organization IdPs", async () => {
    const repo = new InMemoryOrganizationRepository([
      {
        id: OrganizationId.fromString(ORG_ID),
        name: "contoso",
        alias: "contoso",
        enabled: true,
        description: null,
        domains: [{ name: "contoso.com", verified: true }],
      },
    ]);
    const tools = buildOrgTools({ organizationRepository: repo, confirmers });
    const link = tools.find(
      (candidate) => candidate.name === "keycloak_org_idp_link",
    );
    await link!.handler({
      organizationId: ORG_ID,
      idpAlias: "contoso-sso",
    });
    expect(repo.linked[0]).toEqual({ id: ORG_ID, alias: "contoso-sso" });

    const list = tools.find(
      (candidate) => candidate.name === "keycloak_org_idp_list",
    );
    const listed = await list!.handler({ organizationId: ORG_ID });
    expect(listed.content[0]?.text).toContain("contoso-sso");
  });

  it("requires confirm to delete an organization", async () => {
    const repo = new InMemoryOrganizationRepository([
      {
        id: OrganizationId.fromString(ORG_ID),
        name: "contoso",
        alias: "contoso",
        enabled: true,
        description: null,
        domains: [],
      },
    ]);
    const tools = buildOrgTools({ organizationRepository: repo, confirmers });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_org_delete",
    );
    const declined = await tool!.handler({ organizationId: ORG_ID });
    expect(declined.content[0]?.text).toContain("Not deleted");
    expect(repo.deleted).toHaveLength(0);

    const deleted = await tool!.handler({
      organizationId: ORG_ID,
      confirm: true,
    });
    expect(deleted.content[0]?.text).toContain("deleted");
    expect(repo.deleted).toEqual([ORG_ID]);
  });
});
