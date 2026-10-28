import { describe, expect, it } from "vitest";

import { IdpAlias } from "../../../src/domain/shared/idp-alias.js";
import { OrganizationId } from "../../../src/domain/shared/organization-id.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakOrganizationRepository } from "../../../src/infrastructure/keycloak/organization-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
const ORG_ID = "11111111-1111-4111-8111-111111111111";

function makeRepo(responses: Response[]): {
  repo: KeycloakOrganizationRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakOrganizationRepository(client), fetch };
}

describe("KeycloakOrganizationRepository", () => {
  it("lists organizations across pages", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([
        {
          id: ORG_ID,
          name: "contoso",
          alias: "contoso",
          enabled: true,
          domains: [{ name: "contoso.com", verified: true }],
        },
      ]),
    ]);
    const orgs = await repo.list();
    expect(orgs[0]?.name).toBe("contoso");
    expect(orgs[0]?.domains[0]?.verified).toBe(true);
    expect(fetch.requests[0]?.url).toContain("/organizations");
  });

  it("returns null for an unknown organization", async () => {
    const { repo } = makeRepo([jsonResponse({ errorMessage: "x" }, 404)]);
    expect(await repo.find(OrganizationId.fromString(ORG_ID))).toBeNull();
  });

  it("creates an organization then re-reads it from the list", async () => {
    const { repo, fetch } = makeRepo([
      new Response(null, { status: 201 }),
      jsonResponse([
        {
          id: ORG_ID,
          name: "contoso",
          alias: "contoso",
          enabled: true,
          description: "customer",
          domains: [{ name: "contoso.com", verified: true }],
        },
      ]),
    ]);
    const created = await repo.create({
      name: "contoso",
      description: "customer",
      domains: [{ name: "contoso.com", verified: true }],
    });
    expect(created.id.toString()).toBe(ORG_ID);
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.body).toContain('"name":"contoso"');
    expect(fetch.requests[0]?.body).toContain('"verified":true');
  });

  it("links an IdP with a bare JSON string body", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.linkIdentityProvider(
      OrganizationId.fromString(ORG_ID),
      IdpAlias.fromString("contoso-sso"),
    );
    expect(fetch.requests[0]?.url).toContain(
      `/organizations/${ORG_ID}/identity-providers`,
    );
    expect(fetch.requests[0]?.body).toBe('"contoso-sso"');
  });

  it("lists linked IdP aliases", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ alias: "contoso-sso", providerId: "oidc" }]),
    ]);
    const aliases = await repo.listIdentityProviders(
      OrganizationId.fromString(ORG_ID),
    );
    expect(aliases).toEqual(["contoso-sso"]);
  });

  it("unlinks an IdP", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.unlinkIdentityProvider(
      OrganizationId.fromString(ORG_ID),
      IdpAlias.fromString("contoso-sso"),
    );
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.url).toContain(
      `/organizations/${ORG_ID}/identity-providers/contoso-sso`,
    );
  });

  it("deletes an organization", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.delete(OrganizationId.fromString(ORG_ID));
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.url).toContain(`/organizations/${ORG_ID}`);
  });
});
