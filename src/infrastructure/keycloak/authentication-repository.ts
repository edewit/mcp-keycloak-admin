import type {
  AuthFlow,
  AuthFlowExecution,
  RealmFlowBinding,
  RequiredAction,
} from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";
import type { KeycloakAdminClient } from "./admin-client.js";

interface KeycloakFlow {
  readonly id?: string;
  readonly alias?: string;
  readonly builtIn?: boolean;
  readonly description?: string;
  readonly topLevel?: boolean;
}

interface KeycloakFlowExecution {
  readonly id?: string;
  readonly displayName?: string;
  readonly requirement?: string;
  readonly index?: number;
  readonly level?: number;
  readonly providerId?: string;
  readonly authenticationFlow?: boolean;
  readonly configurable?: boolean;
  readonly flowId?: string;
}

interface KeycloakRequiredAction {
  readonly alias?: string;
  readonly name?: string;
  readonly enabled?: boolean;
  readonly defaultAction?: boolean;
}

export class KeycloakAuthenticationRepository implements AuthenticationRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async listFlows(): Promise<AuthFlow[]> {
    const raw = await this.client.getJson<KeycloakFlow[]>(
      "/authentication/flows",
    );
    return raw.map((flow) => ({
      id: flow.id ?? "",
      alias: flow.alias ?? "",
      builtIn: flow.builtIn ?? false,
      ...(flow.description !== undefined
        ? { description: flow.description }
        : {}),
      ...(flow.topLevel !== undefined ? { topLevel: flow.topLevel } : {}),
    }));
  }

  async listFlowExecutions(flowAlias: string): Promise<AuthFlowExecution[]> {
    const raw = await this.client.getJson<KeycloakFlowExecution[]>(
      `/authentication/flows/${encodeURIComponent(flowAlias)}/executions`,
    );
    return raw.map((execution) => ({
      id: execution.id ?? "",
      displayName: execution.displayName ?? "",
      requirement: execution.requirement ?? "",
      index: execution.index ?? 0,
      level: execution.level ?? 0,
      providerId: execution.providerId ?? "",
      authenticationFlow: execution.authenticationFlow ?? false,
      configurable: execution.configurable ?? false,
      ...(execution.flowId !== undefined ? { flowId: execution.flowId } : {}),
    }));
  }

  async copyFlow(flowAlias: string, newName: string): Promise<void> {
    await this.client.post(
      `/authentication/flows/${encodeURIComponent(flowAlias)}/copy`,
      { newName },
    );
  }

  async bindRealmFlow(
    binding: RealmFlowBinding,
    flowAlias: string,
  ): Promise<void> {
    // Keycloak realm PUT blanks omitted fields — always read-merge-write.
    const current = await this.client.getJson<Record<string, unknown>>("");
    await this.client.put("", { ...current, [binding]: flowAlias });
  }

  async listRequiredActions(): Promise<RequiredAction[]> {
    const raw = await this.client.getJson<KeycloakRequiredAction[]>(
      "/authentication/required-actions",
    );
    return raw.map((action) => ({
      alias: action.alias ?? "",
      name: action.name ?? "",
      enabled: action.enabled ?? false,
      defaultAction: action.defaultAction ?? false,
    }));
  }

  async setRequiredActionEnabled(
    alias: string,
    enabled: boolean,
  ): Promise<void> {
    const current = await this.client.getJson<Record<string, unknown>>(
      `/authentication/required-actions/${encodeURIComponent(alias)}`,
    );
    await this.client.put(
      `/authentication/required-actions/${encodeURIComponent(alias)}`,
      { ...current, enabled },
    );
  }
}
