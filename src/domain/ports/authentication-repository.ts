import type {
  AuthFlow,
  AuthFlowExecution,
  RealmFlowBinding,
  RequiredAction,
} from "../authentication/authentication.js";

export interface AuthenticationRepository {
  listFlows(): Promise<AuthFlow[]>;
  listFlowExecutions(flowAlias: string): Promise<AuthFlowExecution[]>;
  copyFlow(flowAlias: string, newName: string): Promise<void>;
  bindRealmFlow(binding: RealmFlowBinding, flowAlias: string): Promise<void>;
  listRequiredActions(): Promise<RequiredAction[]>;
  setRequiredActionEnabled(alias: string, enabled: boolean): Promise<void>;
}
