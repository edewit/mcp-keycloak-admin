import { describe, expect, it } from "vitest";

import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakRealmInfo } from "../../../src/infrastructure/keycloak/realm-info.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };

function makeRealm(responses: Response[]): {
  realm: KeycloakRealmInfo;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { realm: new KeycloakRealmInfo(client), fetch };
}

describe("KeycloakRealmInfo", () => {
  it("updates smtp via GET then PUT merge without blanking fields", async () => {
    const { realm, fetch } = makeRealm([
      jsonResponse({
        realm: "demo-realm",
        enabled: true,
        browserFlow: "browser",
      }),
      new Response(null, { status: 204 }),
    ]);
    await realm.updateRealmConfig({
      smtpServer: {
        host: "mail",
        port: "1025",
        from: "noreply@example.com",
        auth: false,
        ssl: false,
        starttls: false,
      },
    });
    expect(fetch.requests[0]?.method).toBe("GET");
    expect(fetch.requests[1]?.method).toBe("PUT");
    expect(fetch.requests[1]?.body).toContain('"enabled":true');
    expect(fetch.requests[1]?.body).toContain('"browserFlow":"browser"');
    expect(fetch.requests[1]?.body).toContain('"host":"mail"');
    expect(fetch.requests[1]?.body).toContain('"auth":"false"');
  });

  it("updates webauthn passwordless policy fields", async () => {
    const { realm, fetch } = makeRealm([
      jsonResponse({ realm: "demo-realm", enabled: true }),
      new Response(null, { status: 204 }),
    ]);
    await realm.updateRealmConfig({
      webAuthnPasswordlessPolicy: {
        rpEntityName: "keycloak",
        rpId: "localhost",
        requireResidentKey: "Yes",
        userVerificationRequirement: "preferred",
      },
    });
    expect(fetch.requests[1]?.body).toContain(
      '"webAuthnPolicyPasswordlessRpId":"localhost"',
    );
    expect(fetch.requests[1]?.body).toContain(
      '"webAuthnPolicyPasswordlessRequireResidentKey":"Yes"',
    );
  });

  it("updates organizationsEnabled via GET then PUT merge", async () => {
    const { realm, fetch } = makeRealm([
      jsonResponse({
        realm: "demo-realm",
        enabled: true,
        browserFlow: "browser",
      }),
      new Response(null, { status: 204 }),
    ]);
    await realm.updateRealmConfig({ organizationsEnabled: true });
    expect(fetch.requests[1]?.body).toContain('"organizationsEnabled":true');
    expect(fetch.requests[1]?.body).toContain('"browserFlow":"browser"');
  });

  it("writes acr.loa.map into realm attributes", async () => {
    const { realm, fetch } = makeRealm([
      jsonResponse({
        realm: "demo-realm",
        attributes: { other: "x" },
      }),
      new Response(null, { status: 204 }),
    ]);
    await realm.updateRealmConfig({
      acrLoaMap: { copper: 0, silver: 1, gold: 2 },
    });
    expect(fetch.requests[1]?.body).toContain('"other":"x"');
    expect(fetch.requests[1]?.body).toContain('"acr.loa.map"');
    expect(fetch.requests[1]?.body).toContain("gold");
  });
});
