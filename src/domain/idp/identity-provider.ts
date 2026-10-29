import type { IdpAlias } from "../shared/idp-alias.js";

export interface IdentityProvider {
  readonly alias: IdpAlias;
  readonly providerId: string;
  readonly enabled: boolean;
  readonly displayName: string | null;
  readonly trustEmail: boolean;
}

export interface NewIdentityProvider {
  readonly alias: IdpAlias;
  readonly providerId: string;
  readonly enabled: boolean;
  readonly displayName?: string;
  readonly trustEmail?: boolean;
  readonly config: Record<string, string>;
}

export interface IdentityProviderUpdate {
  readonly enabled?: boolean;
  readonly displayName?: string;
  readonly trustEmail?: boolean;
  /** Merged into the existing provider config map. */
  readonly config?: Record<string, string>;
}

export interface IdpMapper {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}
