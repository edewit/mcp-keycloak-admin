import type {
  AuthFlow,
  AuthFlowExecution,
  RealmFlowBinding,
  RequiredAction,
} from "../../src/domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../src/domain/ports/authentication-repository.js";

export class InMemoryAuthenticationRepository implements AuthenticationRepository {
  readonly toggled: { alias: string; enabled: boolean }[] = [];
  readonly copied: { flowAlias: string; newName: string }[] = [];
  readonly bound: { binding: RealmFlowBinding; flowAlias: string }[] = [];
  private readonly flows: AuthFlow[];
  private readonly actions: RequiredAction[];
  private readonly executions: Map<string, AuthFlowExecution[]>;

  constructor(
    flows: AuthFlow[] = [],
    actions: RequiredAction[] = [],
    executions: Map<string, AuthFlowExecution[]> = new Map(),
  ) {
    this.flows = flows;
    this.actions = actions;
    this.executions = executions;
  }

  listFlows(): Promise<AuthFlow[]> {
    return Promise.resolve(this.flows);
  }

  listFlowExecutions(flowAlias: string): Promise<AuthFlowExecution[]> {
    return Promise.resolve(this.executions.get(flowAlias) ?? []);
  }

  copyFlow(flowAlias: string, newName: string): Promise<void> {
    this.copied.push({ flowAlias, newName });
    this.flows.push({ id: "copied", alias: newName, builtIn: false });
    return Promise.resolve();
  }

  bindRealmFlow(binding: RealmFlowBinding, flowAlias: string): Promise<void> {
    this.bound.push({ binding, flowAlias });
    return Promise.resolve();
  }

  listRequiredActions(): Promise<RequiredAction[]> {
    return Promise.resolve(this.actions);
  }

  setRequiredActionEnabled(alias: string, enabled: boolean): Promise<void> {
    this.toggled.push({ alias, enabled });
    return Promise.resolve();
  }
}
