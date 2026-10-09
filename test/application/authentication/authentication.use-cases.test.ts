import { describe, expect, it } from "vitest";

import { BindRealmFlowUseCase } from "../../../src/application/authentication/bind-realm-flow.use-case.js";
import { CopyAuthFlowUseCase } from "../../../src/application/authentication/copy-auth-flow.use-case.js";
import { ListAuthFlowsUseCase } from "../../../src/application/authentication/list-auth-flows.use-case.js";
import { ListFlowExecutionsUseCase } from "../../../src/application/authentication/list-flow-executions.use-case.js";
import { ListRequiredActionsUseCase } from "../../../src/application/authentication/list-required-actions.use-case.js";
import { SetRequiredActionEnabledUseCase } from "../../../src/application/authentication/set-required-action-enabled.use-case.js";
import { InMemoryAuthenticationRepository } from "../../support/in-memory-authentication-repository.js";

describe("authentication use cases", () => {
  it("lists authentication flows", async () => {
    const repo = new InMemoryAuthenticationRepository([
      { id: "1", alias: "browser", builtIn: true },
    ]);
    const flows = await new ListAuthFlowsUseCase(repo).execute();
    expect(flows[0]?.alias).toBe("browser");
  });

  it("lists flow executions", async () => {
    const repo = new InMemoryAuthenticationRepository(
      [],
      [],
      new Map([
        [
          "browser",
          [
            {
              id: "e1",
              displayName: "Cookie",
              requirement: "ALTERNATIVE",
              index: 0,
              level: 0,
              providerId: "auth-cookie",
              authenticationFlow: false,
              configurable: false,
            },
          ],
        ],
      ]),
    );
    const executions = await new ListFlowExecutionsUseCase(repo).execute(
      "browser",
    );
    expect(executions[0]?.providerId).toBe("auth-cookie");
  });

  it("copies a flow", async () => {
    const repo = new InMemoryAuthenticationRepository([
      { id: "1", alias: "browser", builtIn: true },
    ]);
    await new CopyAuthFlowUseCase(repo).execute({
      flowAlias: "browser",
      newName: "browser-copy",
    });
    expect(repo.copied[0]).toEqual({
      flowAlias: "browser",
      newName: "browser-copy",
    });
  });

  it("binds a realm flow", async () => {
    const repo = new InMemoryAuthenticationRepository();
    await new BindRealmFlowUseCase(repo).execute({
      binding: "browserFlow",
      flowAlias: "browser-copy",
    });
    expect(repo.bound[0]).toEqual({
      binding: "browserFlow",
      flowAlias: "browser-copy",
    });
  });

  it("lists required actions", async () => {
    const repo = new InMemoryAuthenticationRepository(
      [],
      [
        {
          alias: "VERIFY_EMAIL",
          name: "Verify Email",
          enabled: true,
          defaultAction: false,
        },
      ],
    );
    const actions = await new ListRequiredActionsUseCase(repo).execute();
    expect(actions[0]?.alias).toBe("VERIFY_EMAIL");
  });

  it("toggles a required action", async () => {
    const repo = new InMemoryAuthenticationRepository();
    await new SetRequiredActionEnabledUseCase(repo).execute({
      alias: "VERIFY_EMAIL",
      enabled: false,
    });
    expect(repo.toggled[0]).toEqual({ alias: "VERIFY_EMAIL", enabled: false });
  });
});
