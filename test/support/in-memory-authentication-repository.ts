import type {
  AuthFlow,
  AuthFlowExecution,
  AuthFlowRequirement,
  AuthenticatorProvider,
  RealmFlowBinding,
  RequiredAction,
} from "../../src/domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../src/domain/ports/authentication-repository.js";

export class InMemoryAuthenticationRepository implements AuthenticationRepository {
  readonly toggled: { alias: string; enabled: boolean }[] = [];
  readonly created: { alias: string; description?: string }[] = [];
  readonly copied: { flowAlias: string; newName: string }[] = [];
  readonly bound: { binding: RealmFlowBinding; flowAlias: string }[] = [];
  readonly added: { flowAlias: string; providerId: string }[] = [];
  readonly subFlows: {
    parentFlowAlias: string;
    alias: string;
    description?: string;
  }[] = [];
  readonly updated: {
    flowAlias: string;
    executionId: string;
    requirement: AuthFlowRequirement;
  }[] = [];
  readonly raised: string[] = [];
  readonly lowered: string[] = [];
  readonly deletedExecutions: string[] = [];
  private readonly flows: AuthFlow[];
  private readonly actions: RequiredAction[];
  private readonly executions: Map<string, AuthFlowExecution[]>;
  private readonly providers: AuthenticatorProvider[];

  constructor(
    flows: AuthFlow[] = [],
    actions: RequiredAction[] = [],
    executions: Map<string, AuthFlowExecution[]> = new Map(),
    providers: AuthenticatorProvider[] = [],
  ) {
    this.flows = flows;
    this.actions = actions;
    this.executions = executions;
    this.providers = providers;
  }

  listFlows(): Promise<AuthFlow[]> {
    return Promise.resolve(this.flows);
  }

  listFlowExecutions(flowAlias: string): Promise<AuthFlowExecution[]> {
    return Promise.resolve(this.executions.get(flowAlias) ?? []);
  }

  listAuthenticatorProviders(): Promise<AuthenticatorProvider[]> {
    return Promise.resolve(this.providers);
  }

  createFlow(alias: string, description?: string): Promise<void> {
    this.created.push(
      description === undefined ? { alias } : { alias, description },
    );
    this.flows.push({
      id: `flow-${String(this.flows.length)}`,
      alias,
      builtIn: false,
      topLevel: true,
      ...(description !== undefined ? { description } : {}),
    });
    return Promise.resolve();
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

  addExecution(flowAlias: string, providerId: string): Promise<void> {
    this.added.push({ flowAlias, providerId });
    const list = this.executions.get(flowAlias) ?? [];
    list.push({
      id: `exec-${String(list.length)}`,
      displayName: providerId,
      requirement: "DISABLED",
      index: list.length,
      level: 0,
      providerId,
      authenticationFlow: false,
      configurable: false,
    });
    this.executions.set(flowAlias, list);
    return Promise.resolve();
  }

  addSubFlow(
    parentFlowAlias: string,
    alias: string,
    description?: string,
  ): Promise<void> {
    this.subFlows.push(
      description === undefined
        ? { parentFlowAlias, alias }
        : { parentFlowAlias, alias, description },
    );
    const list = this.executions.get(parentFlowAlias) ?? [];
    list.push({
      id: `sub-${String(list.length)}`,
      displayName: alias,
      requirement: "DISABLED",
      index: list.length,
      level: 0,
      providerId: "",
      authenticationFlow: true,
      configurable: false,
      flowId: `flow-${alias}`,
    });
    this.executions.set(parentFlowAlias, list);
    this.flows.push({
      id: `flow-${alias}`,
      alias,
      builtIn: false,
      topLevel: false,
    });
    return Promise.resolve();
  }

  updateExecutionRequirement(
    flowAlias: string,
    executionId: string,
    requirement: AuthFlowRequirement,
  ): Promise<void> {
    this.updated.push({ flowAlias, executionId, requirement });
    const list = this.executions.get(flowAlias) ?? [];
    this.executions.set(
      flowAlias,
      list.map((execution) =>
        execution.id === executionId
          ? { ...execution, requirement }
          : execution,
      ),
    );
    return Promise.resolve();
  }

  raiseExecutionPriority(executionId: string): Promise<void> {
    this.raised.push(executionId);
    return Promise.resolve();
  }

  lowerExecutionPriority(executionId: string): Promise<void> {
    this.lowered.push(executionId);
    return Promise.resolve();
  }

  deleteExecution(executionId: string): Promise<void> {
    this.deletedExecutions.push(executionId);
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
