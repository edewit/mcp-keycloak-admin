import { z } from "zod";

import { GetAdminEventsUseCase } from "../../application/events/get-admin-events.use-case.js";
import { GetLoginEventsUseCase } from "../../application/events/get-login-events.use-case.js";
import { GetRealmConfigUseCase } from "../../application/realm/get-realm-config.use-case.js";
import { GetServerInfoUseCase } from "../../application/realm/get-server-info.use-case.js";
import { UpdateRealmConfigUseCase } from "../../application/realm/update-realm-config.use-case.js";
import type { EventQuery } from "../../domain/event/events.js";
import type { EventLog } from "../../domain/ports/event-log.js";
import type { RealmInfo } from "../../domain/ports/realm-info.js";
import type { RealmConfigPatch } from "../../domain/realm/realm-config.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface EventRealmToolDeps {
  readonly eventLog: EventLog;
  readonly realmInfo: RealmInfo;
}

const REALM_FIELDS = [
  "realm",
  "enabled",
  "registrationAllowed",
  "resetPasswordAllowed",
  "verifyEmail",
  "loginWithEmailAllowed",
  "bruteForceProtected",
  "sslRequired",
  "accessTokenLifespan",
  "ssoSessionIdleTimeout",
  "ssoSessionMaxLifespan",
  "browserFlow",
  "webAuthnPolicyPasswordlessRpEntityName",
  "webAuthnPolicyPasswordlessRpId",
  "webAuthnPolicyPasswordlessRequireResidentKey",
  "webAuthnPolicyPasswordlessUserVerificationRequirement",
] as const;

const READ_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
} as const;

const smtpServerSchema = z
  .object({
    host: z.string().describe("SMTP host. Required when smtpServer is set."),
    from: z
      .string()
      .describe(
        "From address for realm emails. Required when smtpServer is set.",
      ),
    port: z.string().optional().describe("SMTP port as a string (e.g. '587')."),
    fromDisplayName: z.string().optional(),
    replyTo: z.string().optional(),
    replyToDisplayName: z.string().optional(),
    envelopeFrom: z.string().optional(),
    auth: z.boolean().optional().describe("Whether SMTP AUTH is required."),
    user: z.string().optional(),
    password: z.string().optional(),
    ssl: z.boolean().optional(),
    starttls: z.boolean().optional(),
  })
  .describe(
    "Replaces realm smtpServer (read-merge-write of the realm). Omit password only when auth is false.",
  );

const webAuthnPasswordlessPolicySchema = z
  .object({
    rpEntityName: z
      .string()
      .optional()
      .describe("Relying party entity name for passwordless WebAuthn."),
    rpId: z
      .string()
      .optional()
      .describe(
        "Relying party ID — must match the hostname the browser uses (e.g. localhost).",
      ),
    requireResidentKey: z
      .enum(["Yes", "No"])
      .optional()
      .describe('Usually "Yes" for discoverable passkeys.'),
    userVerificationRequirement: z
      .enum(["required", "preferred", "discouraged"])
      .optional(),
  })
  .describe(
    "Sets webAuthnPolicyPasswordless* fields only (not ordinary 2FA WebAuthn).",
  );

function pick(
  record: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in record) {
      out[key] = record[key];
    }
  }
  return out;
}

function smtpSummary(
  record: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const smtp = record.smtpServer;
  if (typeof smtp !== "object" || smtp === null) {
    return undefined;
  }
  const map = smtp as Record<string, unknown>;
  return {
    host: map.host ?? null,
    from: map.from ?? null,
    port: map.port ?? null,
    auth: map.auth ?? null,
    ssl: map.ssl ?? null,
    starttls: map.starttls ?? null,
    hasPassword: typeof map.password === "string" && map.password.length > 0,
  };
}

function serverSummary(info: Record<string, unknown>): Record<string, unknown> {
  const systemInfo = info.systemInfo;
  const version =
    typeof systemInfo === "object" &&
    systemInfo !== null &&
    "version" in systemInfo
      ? (systemInfo as Record<string, unknown>).version
      : null;
  return { keycloakVersion: version };
}

function eventQuery(args: Record<string, unknown>): EventQuery {
  const query: { max: number; type?: string; user?: string } = {
    max: typeof args.max === "number" ? args.max : 20,
  };
  if (typeof args.type === "string") {
    query.type = args.type;
  }
  if (typeof args.user === "string") {
    query.user = args.user;
  }
  return query;
}

function loginEventsTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_events_login",
    title: "List login events",
    description:
      "Read-only. Returns recent user login events from the realm's login event log (such as LOGIN, LOGIN_ERROR, and LOGOUT), as a JSON array ordered by the event log's default ordering. Use this to audit authentication activity or investigate failed logins; for administrative changes (user/role/config updates) use keycloak_events_admin instead. This tool is idempotent and never modifies Keycloak.",
    level: ToolLevel.Read,
    inputSchema: {
      max: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe(
          "Maximum number of login events to return. Integer between 1 and 500. Defaults to 20 when omitted.",
        ),
      type: z
        .string()
        .optional()
        .describe(
          "Optional Keycloak login event type to filter by, e.g. 'LOGIN', 'LOGIN_ERROR', or 'LOGOUT'. When omitted, events of all types are returned.",
        ),
      user: z
        .string()
        .optional()
        .describe(
          "Optional Keycloak user ID (UUID) to restrict results to a single user. When omitted, events for all users are returned.",
        ),
    },
    annotations: READ_ANNOTATIONS,
    async handler(args) {
      const events = await new GetLoginEventsUseCase(deps.eventLog).execute(
        eventQuery(args),
      );
      return textResult(JSON.stringify(events, null, 2));
    },
  };
}

function adminEventsTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_events_admin",
    title: "List admin events",
    description:
      "Read-only. Returns recent administrative events from the realm's admin event log (such as CREATE, UPDATE, and DELETE operations on users, roles, clients, and configuration) as a JSON array. Use this to audit who changed what in the realm; for end-user authentication activity use keycloak_events_login instead. This tool is idempotent and never modifies Keycloak.",
    level: ToolLevel.Read,
    inputSchema: {
      max: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe(
          "Maximum number of admin events to return. Integer between 1 and 500. Defaults to 20 when omitted.",
        ),
    },
    annotations: READ_ANNOTATIONS,
    async handler(args) {
      const events = await new GetAdminEventsUseCase(deps.eventLog).execute(
        eventQuery(args),
      );
      return textResult(JSON.stringify(events, null, 2));
    },
  };
}

function realmConfigTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_realm_get_config",
    title: "Get realm configuration",
    description:
      "Read-only. Returns a curated subset of the realm's configuration as a JSON object: registration/password-reset flags, email verification, brute-force and SSL settings, token/SSO lifespans, browserFlow, WebAuthn passwordless policy fields, and a redacted smtp summary (host/from/flags, hasPassword — never the password). Use after keycloak_realm_update to verify. Takes no parameters.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: READ_ANNOTATIONS,
    async handler() {
      const config = await new GetRealmConfigUseCase(deps.realmInfo).execute();
      const curated = pick(config, REALM_FIELDS);
      const smtp = smtpSummary(config);
      if (smtp !== undefined) {
        curated.smtpServer = smtp;
      }
      return textResult(JSON.stringify(curated, null, 2));
    },
  };
}

function updateRealmConfigTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_realm_update",
    title: "Update realm SMTP or WebAuthn passwordless policy",
    description:
      "Write. Read-merge-writes the realm representation so omitted fields are not blanked. Provide smtpServer and/or webAuthnPasswordlessPolicy (at least one required). smtpServer replaces the whole SMTP map; passwordless policy sets only webAuthnPolicyPasswordless* fields (not 2FA WebAuthn). Verify with keycloak_realm_get_config.",
    level: ToolLevel.Write,
    inputSchema: {
      smtpServer: smtpServerSchema.optional(),
      webAuthnPasswordlessPolicy: webAuthnPasswordlessPolicySchema.optional(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const smtpArg =
        args.smtpServer !== undefined && args.smtpServer !== null
          ? (args.smtpServer as {
              host: string;
              from: string;
              port?: string;
              fromDisplayName?: string;
              replyTo?: string;
              replyToDisplayName?: string;
              envelopeFrom?: string;
              auth?: boolean;
              user?: string;
              password?: string;
              ssl?: boolean;
              starttls?: boolean;
            })
          : undefined;
      const policyArg =
        args.webAuthnPasswordlessPolicy !== undefined &&
        args.webAuthnPasswordlessPolicy !== null
          ? (args.webAuthnPasswordlessPolicy as {
              rpEntityName?: string;
              rpId?: string;
              requireResidentKey?: "Yes" | "No";
              userVerificationRequirement?:
                "required" | "preferred" | "discouraged";
            })
          : undefined;

      const patch: RealmConfigPatch = {
        ...(smtpArg !== undefined
          ? {
              smtpServer: {
                host: String(smtpArg.host),
                from: String(smtpArg.from),
                ...(smtpArg.port !== undefined
                  ? { port: String(smtpArg.port) }
                  : {}),
                ...(smtpArg.fromDisplayName !== undefined
                  ? { fromDisplayName: String(smtpArg.fromDisplayName) }
                  : {}),
                ...(smtpArg.replyTo !== undefined
                  ? { replyTo: String(smtpArg.replyTo) }
                  : {}),
                ...(smtpArg.replyToDisplayName !== undefined
                  ? { replyToDisplayName: String(smtpArg.replyToDisplayName) }
                  : {}),
                ...(smtpArg.envelopeFrom !== undefined
                  ? { envelopeFrom: String(smtpArg.envelopeFrom) }
                  : {}),
                ...(typeof smtpArg.auth === "boolean"
                  ? { auth: smtpArg.auth }
                  : {}),
                ...(smtpArg.user !== undefined
                  ? { user: String(smtpArg.user) }
                  : {}),
                ...(smtpArg.password !== undefined
                  ? { password: String(smtpArg.password) }
                  : {}),
                ...(typeof smtpArg.ssl === "boolean"
                  ? { ssl: smtpArg.ssl }
                  : {}),
                ...(typeof smtpArg.starttls === "boolean"
                  ? { starttls: smtpArg.starttls }
                  : {}),
              },
            }
          : {}),
        ...(policyArg !== undefined
          ? {
              webAuthnPasswordlessPolicy: {
                ...(policyArg.rpEntityName !== undefined
                  ? { rpEntityName: String(policyArg.rpEntityName) }
                  : {}),
                ...(policyArg.rpId !== undefined
                  ? { rpId: String(policyArg.rpId) }
                  : {}),
                ...(policyArg.requireResidentKey !== undefined
                  ? { requireResidentKey: policyArg.requireResidentKey }
                  : {}),
                ...(policyArg.userVerificationRequirement !== undefined
                  ? {
                      userVerificationRequirement:
                        policyArg.userVerificationRequirement,
                    }
                  : {}),
              },
            }
          : {}),
      };
      await new UpdateRealmConfigUseCase(deps.realmInfo).execute(patch);
      const parts: string[] = [];
      if (patch.smtpServer !== undefined) {
        parts.push("smtpServer");
      }
      if (patch.webAuthnPasswordlessPolicy !== undefined) {
        parts.push("webAuthnPasswordlessPolicy");
      }
      return textResult(
        `Updated realm ${parts.join(" and ")}. Re-read with keycloak_realm_get_config.`,
      );
    },
  };
}

function serverInfoTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_server_info",
    title: "Get server info",
    description:
      "Read-only. Returns a small JSON summary of the connected Keycloak server, containing the 'keycloakVersion' field (the server version, or null when it cannot be determined). Use this for a quick connectivity and version check; for realm-specific settings use keycloak_realm_get_config instead. Takes no parameters; it is idempotent and never modifies Keycloak.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: READ_ANNOTATIONS,
    async handler() {
      const info = await new GetServerInfoUseCase(deps.realmInfo).execute();
      return textResult(JSON.stringify(serverSummary(info), null, 2));
    },
  };
}

export function buildEventRealmTools(
  deps: EventRealmToolDeps,
): ToolDefinition[] {
  return [
    loginEventsTool(deps),
    adminEventsTool(deps),
    realmConfigTool(deps),
    updateRealmConfigTool(deps),
    serverInfoTool(deps),
  ];
}
