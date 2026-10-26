import type { RealmInfo } from "../../domain/ports/realm-info.js";
import type {
  RealmConfigPatch,
  SmtpServerConfig,
  WebAuthnPasswordlessPolicy,
} from "../../domain/realm/realm-config.js";
import type { KeycloakAdminClient } from "./admin-client.js";

function boolString(value: boolean): string {
  return value ? "true" : "false";
}

function toKeycloakSmtp(smtp: SmtpServerConfig): Record<string, string> {
  const out: Record<string, string> = {
    host: smtp.host,
    from: smtp.from,
  };
  if (smtp.port !== undefined) {
    out.port = smtp.port;
  }
  if (smtp.fromDisplayName !== undefined) {
    out.fromDisplayName = smtp.fromDisplayName;
  }
  if (smtp.replyTo !== undefined) {
    out.replyTo = smtp.replyTo;
  }
  if (smtp.replyToDisplayName !== undefined) {
    out.replyToDisplayName = smtp.replyToDisplayName;
  }
  if (smtp.envelopeFrom !== undefined) {
    out.envelopeFrom = smtp.envelopeFrom;
  }
  if (smtp.auth !== undefined) {
    out.auth = boolString(smtp.auth);
  }
  if (smtp.user !== undefined) {
    out.user = smtp.user;
  }
  if (smtp.password !== undefined) {
    out.password = smtp.password;
  }
  if (smtp.ssl !== undefined) {
    out.ssl = boolString(smtp.ssl);
  }
  if (smtp.starttls !== undefined) {
    out.starttls = boolString(smtp.starttls);
  }
  return out;
}

function applyPasswordlessPolicy(
  target: Record<string, unknown>,
  policy: WebAuthnPasswordlessPolicy,
): void {
  if (policy.rpEntityName !== undefined) {
    target.webAuthnPolicyPasswordlessRpEntityName = policy.rpEntityName;
  }
  if (policy.rpId !== undefined) {
    target.webAuthnPolicyPasswordlessRpId = policy.rpId;
  }
  if (policy.requireResidentKey !== undefined) {
    target.webAuthnPolicyPasswordlessRequireResidentKey =
      policy.requireResidentKey;
  }
  if (policy.userVerificationRequirement !== undefined) {
    target.webAuthnPolicyPasswordlessUserVerificationRequirement =
      policy.userVerificationRequirement;
  }
}

export class KeycloakRealmInfo implements RealmInfo {
  constructor(private readonly client: KeycloakAdminClient) {}

  getRealmConfig(): Promise<Record<string, unknown>> {
    return this.client.getJson<Record<string, unknown>>("");
  }

  async updateRealmConfig(patch: RealmConfigPatch): Promise<void> {
    // Keycloak realm PUT blanks omitted fields — always read-merge-write.
    const current = await this.client.getJson<Record<string, unknown>>("");
    const merged: Record<string, unknown> = { ...current };
    if (patch.smtpServer !== undefined) {
      merged.smtpServer = toKeycloakSmtp(patch.smtpServer);
    }
    if (patch.webAuthnPasswordlessPolicy !== undefined) {
      applyPasswordlessPolicy(merged, patch.webAuthnPasswordlessPolicy);
    }
    await this.client.put("", merged);
  }

  serverInfo(): Promise<Record<string, unknown>> {
    return this.client.getAdminJson<Record<string, unknown>>("/serverinfo");
  }
}
