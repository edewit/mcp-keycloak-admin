import type { ClientId } from "../shared/client-id.js";

export interface NewClient {
  readonly clientId: ClientId;
  readonly enabled: boolean;
  readonly publicClient: boolean;
  readonly redirectUris: string[];
  readonly webOrigins: string[];
}

export interface ClientUpdate {
  readonly enabled?: boolean;
  readonly publicClient?: boolean;
  readonly redirectUris?: string[];
  readonly webOrigins?: string[];
  /** Merged into existing client attributes (string values). */
  readonly attributes?: Readonly<Record<string, string>>;
  /**
   * Merged into `authenticationFlowBindingOverrides`. Values must be flow
   * **ids**; pass an empty string for a key to remove that override.
   */
  readonly authenticationFlowBindingOverrides?: Readonly<
    Record<string, string>
  >;
}
