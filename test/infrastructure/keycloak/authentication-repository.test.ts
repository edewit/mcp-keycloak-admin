import { describe, expect, it } from "vitest";

import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakAuthenticationRepository } from "../../../src/infrastructure/keycloak/authentication-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };

function makeRepo(responses: Response[]): {
  repo: KeycloakAuthenticationRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakAuthenticationRepository(client), fetch };
}

describe("KeycloakAuthenticationRepository", () => {
  it("lists flows", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ id: "1", alias: "browser", builtIn: true }]),
    ]);
    const flows = await repo.listFlows();
    expect(flows[0]?.alias).toBe("browser");
  });

  it("lists flow executions", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([
        {
          id: "e1",
          displayName: "Cookie",
          requirement: "ALTERNATIVE",
          providerId: "auth-cookie",
          index: 0,
          level: 0,
        },
      ]),
    ]);
    const executions = await repo.listFlowExecutions("browser");
    expect(executions[0]?.providerId).toBe("auth-cookie");
    expect(fetch.requests[0]?.url).toContain(
      "/authentication/flows/browser/executions",
    );
  });

  it("copies a flow", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);
    await repo.copyFlow("browser", "browser-copy");
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(
      "/authentication/flows/browser/copy",
    );
    expect(fetch.requests[0]?.body).toContain('"newName":"browser-copy"');
  });

  it("binds a realm flow via GET then PUT merge", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse({
        realm: "demo-realm",
        browserFlow: "browser",
        enabled: true,
      }),
      new Response(null, { status: 204 }),
    ]);
    await repo.bindRealmFlow("browserFlow", "browser-copy");
    expect(fetch.requests[0]?.method).toBe("GET");
    expect(fetch.requests[1]?.method).toBe("PUT");
    expect(fetch.requests[1]?.body).toContain('"browserFlow":"browser-copy"');
    expect(fetch.requests[1]?.body).toContain('"enabled":true');
  });

  it("lists required actions", async () => {
    const { repo } = makeRepo([
      jsonResponse([
        { alias: "VERIFY_EMAIL", name: "Verify Email", enabled: true },
      ]),
    ]);
    const actions = await repo.listRequiredActions();
    expect(actions[0]?.alias).toBe("VERIFY_EMAIL");
  });

  it("toggles a required action via GET then PUT", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse({
        alias: "VERIFY_EMAIL",
        name: "Verify Email",
        enabled: true,
      }),
      new Response(null, { status: 204 }),
    ]);
    await repo.setRequiredActionEnabled("VERIFY_EMAIL", false);
    expect(fetch.requests[0]?.method).toBe("GET");
    expect(fetch.requests[1]?.method).toBe("PUT");
    expect(fetch.requests[1]?.body).toContain('"enabled":false');
  });
});
