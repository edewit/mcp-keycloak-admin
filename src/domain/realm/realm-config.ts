/** SMTP settings for Keycloak realm `smtpServer` (stringly-typed on the wire). */
export interface SmtpServerConfig {
  readonly host: string;
  readonly from: string;
  readonly port?: string;
  readonly fromDisplayName?: string;
  readonly replyTo?: string;
  readonly replyToDisplayName?: string;
  readonly envelopeFrom?: string;
  readonly auth?: boolean;
  readonly user?: string;
  readonly password?: string;
  readonly ssl?: boolean;
  readonly starttls?: boolean;
}

/** Subset of realm WebAuthn *passwordless* policy fields (not 2FA WebAuthn). */
export interface WebAuthnPasswordlessPolicy {
  readonly rpEntityName?: string;
  readonly rpId?: string;
  readonly requireResidentKey?: "Yes" | "No";
  readonly userVerificationRequirement?:
    | "required"
    | "preferred"
    | "discouraged";
}

/** Allowlisted realm write patch — always applied via read-merge-write. */
export interface RealmConfigPatch {
  readonly smtpServer?: SmtpServerConfig;
  readonly webAuthnPasswordlessPolicy?: WebAuthnPasswordlessPolicy;
  /** Stock Keycloak Organizations feature flag (required for domain routing). */
  readonly organizationsEnabled?: boolean;
  /**
   * ACR → LoA map written to realm attribute `acr.loa.map` as JSON
   * (e.g. `{ copper: 0, silver: 1, gold: 2 }`).
   */
  readonly acrLoaMap?: Readonly<Record<string, number>>;
}
