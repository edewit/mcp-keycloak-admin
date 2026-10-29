import { z } from "zod";

import { CreateIdentityProviderUseCase } from "../../application/idp/create-identity-provider.use-case.js";
import { DeleteIdentityProviderUseCase } from "../../application/idp/delete-identity-provider.use-case.js";
import { GetIdentityProviderUseCase } from "../../application/idp/get-identity-provider.use-case.js";
import { ListIdentityProvidersUseCase } from "../../application/idp/list-identity-providers.use-case.js";
import { ListIdpMappersUseCase } from "../../application/idp/list-idp-mappers.use-case.js";
import { UpdateIdentityProviderUseCase } from "../../application/idp/update-identity-provider.use-case.js";
import type { IdentityProvider } from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { IdpAlias } from "../../domain/shared/idp-alias.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface IdpToolDeps {
  readonly identityProviderRepository: IdentityProviderRepository;
  readonly confirmers: ConfirmerFactory;
}

function serializeIdp(idp: IdentityProvider): Record<string, unknown> {
  return {
    alias: idp.alias.toString(),
    providerId: idp.providerId,
    enabled: idp.enabled,
    displayName: idp.displayName,
    trustEmail: idp.trustEmail,
  };
}

function readConfig(value: unknown): Record<string, string> {
  const config: Record<string, string> = {};
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (typeof entry === "string") {
        config[key] = entry;
      }
    }
  }
  return config;
}

function listIdpsTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_list",
    title: "List identity providers",
    description:
      "Lists all identity providers configured in the target realm. Read-only and idempotent; it makes no changes. Use it to discover available providers before calling keycloak_idp_get, keycloak_idp_mappers_list, keycloak_idp_update, or keycloak_idp_delete. Takes no parameters and returns a JSON array of providers, each with alias, providerId, enabled, displayName, and trustEmail.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const idps = await new ListIdentityProvidersUseCase(
        deps.identityProviderRepository,
      ).execute();
      return textResult(JSON.stringify(idps.map(serializeIdp), null, 2));
    },
  };
}

function getIdpTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_get",
    title: "Get identity provider",
    description:
      'Fetches a single identity provider by its alias from the target realm. Read-only and idempotent; it makes no changes. Use it to inspect one provider after finding its alias with keycloak_idp_list. Returns alias, providerId, enabled, displayName, and trustEmail, or "Identity provider not found."',
    level: ToolLevel.Read,
    inputSchema: {
      alias: z
        .string()
        .describe(
          'Unique alias identifying the identity provider within the realm, as shown by keycloak_idp_list (e.g. "google", "corporate-saml"). Required.',
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const idp = await new GetIdentityProviderUseCase(
        deps.identityProviderRepository,
      ).execute(IdpAlias.fromString(String(args.alias)));
      return textResult(
        idp === null
          ? "Identity provider not found."
          : JSON.stringify(serializeIdp(idp), null, 2),
      );
    },
  };
}

function listIdpMappersTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_mappers_list",
    title: "List identity provider mappers",
    description:
      "Lists the mappers configured on a single identity provider, identified by its alias. Mappers control how claims and attributes from the external provider are mapped into Keycloak users. Read-only and idempotent; it makes no changes. Use it after keycloak_idp_list or keycloak_idp_get to inspect a provider's mappers. Returns a JSON array of mapper definitions.",
    level: ToolLevel.Read,
    inputSchema: {
      alias: z
        .string()
        .describe(
          'Unique alias of the identity provider whose mappers to list, as shown by keycloak_idp_list (e.g. "google", "corporate-saml"). Required.',
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const mappers = await new ListIdpMappersUseCase(
        deps.identityProviderRepository,
      ).execute(IdpAlias.fromString(String(args.alias)));
      return textResult(JSON.stringify(mappers, null, 2));
    },
  };
}

function createIdpTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_create",
    title: "Create identity provider",
    description:
      "Creates a new identity provider in the target realm. This is a write operation and is not idempotent: calling it again with an existing alias will fail rather than update. Check keycloak_idp_list first to avoid alias collisions, and use keycloak_idp_get afterward to verify the result. Returns a confirmation message naming the created provider.",
    level: ToolLevel.Write,
    inputSchema: {
      alias: z
        .string()
        .describe(
          'Unique alias for the new identity provider within the realm; used as its identifier in later calls (e.g. "google", "corporate-saml"). Must not collide with an existing alias. Required.',
        ),
      providerId: z
        .string()
        .describe(
          'Keycloak provider type that determines the protocol and expected config keys (e.g. "oidc", "saml", "google", "github"). Required.',
        ),
      enabled: z
        .boolean()
        .optional()
        .describe(
          "Whether the provider is enabled for use. Defaults to true; pass false to create it in a disabled state.",
        ),
      displayName: z
        .string()
        .optional()
        .describe("Optional UI label for the provider on the login page."),
      trustEmail: z
        .boolean()
        .optional()
        .describe(
          "When true, Keycloak trusts emails from this IdP without a verify-email step. Prefer true for corporate SSO where the customer vouches for addresses.",
        ),
      config: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          "Provider-specific configuration as string key/value pairs (e.g. clientId, clientSecret, authorizationUrl, tokenUrl). Non-string values are ignored. Defaults to an empty object when omitted.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      await new CreateIdentityProviderUseCase(
        deps.identityProviderRepository,
      ).execute({
        alias: IdpAlias.fromString(String(args.alias)),
        providerId: String(args.providerId),
        enabled: args.enabled !== false,
        ...(typeof args.displayName === "string"
          ? { displayName: args.displayName }
          : {}),
        ...(typeof args.trustEmail === "boolean"
          ? { trustEmail: args.trustEmail }
          : {}),
        config: readConfig(args.config),
      });
      return textResult(`Identity provider "${String(args.alias)}" created.`);
    },
  };
}

function updateIdpTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_update",
    title: "Update identity provider",
    description:
      "Updates an existing identity provider via read-merge-write. Change enabled, displayName, trustEmail, and/or merge config keys without recreating. Idempotent. Use keycloak_idp_get afterward to verify.",
    level: ToolLevel.Write,
    inputSchema: {
      alias: z
        .string()
        .describe(
          "Unique alias of the identity provider to update, as shown by keycloak_idp_list. Required.",
        ),
      enabled: z
        .boolean()
        .optional()
        .describe("New enabled state. Omit to leave unchanged."),
      displayName: z
        .string()
        .optional()
        .describe("New display name. Omit to leave unchanged."),
      trustEmail: z
        .boolean()
        .optional()
        .describe(
          "Whether to trust IdP emails without verification. Omit to leave unchanged.",
        ),
      config: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          "Config keys to merge into the existing provider config (does not replace the whole map).",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const result = await new UpdateIdentityProviderUseCase(
        deps.identityProviderRepository,
      ).execute(IdpAlias.fromString(String(args.alias)), {
        ...(typeof args.enabled === "boolean" ? { enabled: args.enabled } : {}),
        ...(typeof args.displayName === "string"
          ? { displayName: args.displayName }
          : {}),
        ...(typeof args.trustEmail === "boolean"
          ? { trustEmail: args.trustEmail }
          : {}),
        ...(args.config !== undefined
          ? { config: readConfig(args.config) }
          : {}),
      });
      return textResult(
        result.updated
          ? `Identity provider "${String(args.alias)}" updated.`
          : `Not updated: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function deleteIdpTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_delete",
    title: "Delete identity provider",
    description:
      "Permanently deletes an identity provider from the target realm by its alias. This is a destructive write operation that requires confirmation: it proceeds only when confirm is true, otherwise it is skipped. It is not idempotent, since deleting an already-removed provider has no provider to remove. Use keycloak_idp_list or keycloak_idp_get first to confirm the alias. Returns a message stating whether the provider was deleted or, if not, the reason.",
    level: ToolLevel.Destructive,
    inputSchema: {
      alias: z
        .string()
        .describe(
          'Unique alias of the identity provider to delete, as shown by keycloak_idp_list (e.g. "google", "corporate-saml"). Required.',
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Explicit confirmation flag for this destructive deletion. Must be true to proceed; when omitted or false the deletion is not performed.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new DeleteIdentityProviderUseCase(
        deps.identityProviderRepository,
        confirmer,
      ).execute(IdpAlias.fromString(String(args.alias)));
      return textResult(
        result.deleted
          ? `Identity provider "${String(args.alias)}" deleted.`
          : `Not deleted: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

export function buildIdpTools(deps: IdpToolDeps): ToolDefinition[] {
  return [
    listIdpsTool(deps),
    getIdpTool(deps),
    listIdpMappersTool(deps),
    createIdpTool(deps),
    updateIdpTool(deps),
    deleteIdpTool(deps),
  ];
}
