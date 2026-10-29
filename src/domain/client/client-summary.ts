import type { ClientId } from "../shared/client-id.js";
import type { ClientUuid } from "../shared/client-uuid.js";

/** Read model of a Keycloak client (application). */
export interface ClientSummary {
  readonly uuid: ClientUuid;
  readonly clientId: ClientId;
  readonly enabled: boolean;
  readonly publicClient: boolean;
  readonly redirectUris: readonly string[];
  readonly webOrigins: readonly string[];
  readonly attributes: Readonly<Record<string, string>>;
  /** Binding name → authentication flow id (not alias). */
  readonly authenticationFlowBindingOverrides: Readonly<Record<string, string>>;
}
