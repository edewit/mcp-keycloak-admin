import { z } from "zod";

import { CreateOrganizationUseCase } from "../../application/organization/create-organization.use-case.js";
import { DeleteOrganizationUseCase } from "../../application/organization/delete-organization.use-case.js";
import { GetOrganizationUseCase } from "../../application/organization/get-organization.use-case.js";
import { LinkOrgIdentityProviderUseCase } from "../../application/organization/link-org-identity-provider.use-case.js";
import { ListOrgIdentityProvidersUseCase } from "../../application/organization/list-org-identity-providers.use-case.js";
import { ListOrganizationsUseCase } from "../../application/organization/list-organizations.use-case.js";
import { UnlinkOrgIdentityProviderUseCase } from "../../application/organization/unlink-org-identity-provider.use-case.js";
import type { Organization } from "../../domain/organization/organization.js";
import { organizationDomainFrom } from "../../domain/organization/organization.js";
import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { IdpAlias } from "../../domain/shared/idp-alias.js";
import { OrganizationId } from "../../domain/shared/organization-id.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface OrgToolDeps {
  readonly organizationRepository: OrganizationRepository;
  readonly confirmers: ConfirmerFactory;
}

const READ_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
} as const;

function serializeOrg(org: Organization): Record<string, unknown> {
  return {
    id: org.id.toString(),
    name: org.name,
    alias: org.alias,
    enabled: org.enabled,
    description: org.description,
    domains: org.domains.map((domain) => ({
      name: domain.name,
      verified: domain.verified,
    })),
  };
}

function listOrgsTool(deps: OrgToolDeps): ToolDefinition {
  return {
    name: "keycloak_org_list",
    title: "List organizations",
    description:
      "Lists stock Keycloak Organizations in the target realm (id, name, alias, enabled, description, domains). Read-only and idempotent. Requires organizationsEnabled on the realm (set via keycloak_realm_update). Use before keycloak_org_get, keycloak_org_idp_link, or keycloak_org_delete. Takes no parameters.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: READ_ANNOTATIONS,
    async handler() {
      const orgs = await new ListOrganizationsUseCase(
        deps.organizationRepository,
      ).execute();
      return textResult(JSON.stringify(orgs.map(serializeOrg), null, 2));
    },
  };
}

function getOrgTool(deps: OrgToolDeps): ToolDefinition {
  return {
    name: "keycloak_org_get",
    title: "Get organization",
    description:
      'Fetches one organization by UUID. Read-only and idempotent. Returns id, name, alias, enabled, description, and domains (name + verified), or "Organization not found." Use after keycloak_org_list or keycloak_org_create.',
    level: ToolLevel.Read,
    inputSchema: {
      organizationId: z
        .string()
        .describe(
          "Organization UUID as shown by keycloak_org_list or keycloak_org_create. Required.",
        ),
    },
    annotations: READ_ANNOTATIONS,
    async handler(args) {
      const org = await new GetOrganizationUseCase(
        deps.organizationRepository,
      ).execute(OrganizationId.fromString(String(args.organizationId)));
      return textResult(
        org === null
          ? "Organization not found."
          : JSON.stringify(serializeOrg(org), null, 2),
      );
    },
  };
}

function createOrgTool(deps: OrgToolDeps): ToolDefinition {
  return {
    name: "keycloak_org_create",
    title: "Create organization",
    description:
      "Creates a stock Keycloak Organization with at least one email domain. Domains used for corporate SSO routing must have verified=true. Not idempotent — colliding names fail. Enable the feature first with keycloak_realm_update organizationsEnabled=true. Returns the created organization JSON (including id). Then link an IdP with keycloak_org_idp_link.",
    level: ToolLevel.Write,
    inputSchema: {
      name: z
        .string()
        .describe(
          'Organization display name (often also used as alias), e.g. "contoso". Required.',
        ),
      domains: z
        .array(
          z.object({
            name: z
              .string()
              .describe('Email domain without @, e.g. "contoso.com".'),
            verified: z
              .boolean()
              .optional()
              .describe(
                "Whether the domain is verified for home IdP discovery. Defaults to true; unverified domains never match login emails.",
              ),
          }),
        )
        .min(1)
        .describe(
          "One or more email domains for this organization. At least one required; mark verified for domain-based SSO.",
        ),
      alias: z
        .string()
        .optional()
        .describe("Optional alias; defaults to name when omitted."),
      description: z.string().optional().describe("Optional description."),
      enabled: z
        .boolean()
        .optional()
        .describe("Whether the organization is enabled. Defaults to true."),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const domainArgs = args.domains as {
        name: string;
        verified?: boolean;
      }[];
      const created = await new CreateOrganizationUseCase(
        deps.organizationRepository,
      ).execute({
        name: String(args.name),
        ...(args.alias !== undefined ? { alias: String(args.alias) } : {}),
        ...(args.description !== undefined
          ? { description: String(args.description) }
          : {}),
        enabled: args.enabled !== false,
        domains: domainArgs.map((domain) =>
          organizationDomainFrom(
            String(domain.name),
            domain.verified !== false,
          ),
        ),
      });
      return textResult(JSON.stringify(serializeOrg(created), null, 2));
    },
  };
}

function deleteOrgTool(deps: OrgToolDeps): ToolDefinition {
  return {
    name: "keycloak_org_delete",
    title: "Delete organization",
    description:
      "Permanently deletes an organization by UUID. Destructive — requires confirm=true (or elicitation). Removes domains and IdP links; domain-based SSO for those domains stops. Use keycloak_org_list first.",
    level: ToolLevel.Destructive,
    inputSchema: {
      organizationId: z
        .string()
        .describe("Organization UUID from keycloak_org_list. Required."),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to proceed; when omitted or false the deletion is skipped.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new DeleteOrganizationUseCase(
        deps.organizationRepository,
        confirmer,
      ).execute(OrganizationId.fromString(String(args.organizationId)));
      return textResult(
        result.deleted
          ? `Organization "${String(args.organizationId)}" deleted.`
          : `Not deleted: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function listOrgIdpsTool(deps: OrgToolDeps): ToolDefinition {
  return {
    name: "keycloak_org_idp_list",
    title: "List organization identity providers",
    description:
      "Lists IdP aliases linked to an organization. Read-only. After keycloak_org_idp_link, the corporate IdP alias should appear here for domain routing to work.",
    level: ToolLevel.Read,
    inputSchema: {
      organizationId: z
        .string()
        .describe("Organization UUID from keycloak_org_list. Required."),
    },
    annotations: READ_ANNOTATIONS,
    async handler(args) {
      const aliases = await new ListOrgIdentityProvidersUseCase(
        deps.organizationRepository,
      ).execute(OrganizationId.fromString(String(args.organizationId)));
      return textResult(JSON.stringify(aliases, null, 2));
    },
  };
}

function linkOrgIdpTool(deps: OrgToolDeps): ToolDefinition {
  return {
    name: "keycloak_org_idp_link",
    title: "Link identity provider to organization",
    description:
      "Links an existing identity provider (by alias) to an organization so email-domain home IdP discovery can route to that broker. Write, not idempotent if already linked. Create the IdP with keycloak_idp_create and the org with keycloak_org_create first. Verify with keycloak_org_idp_list.",
    level: ToolLevel.Write,
    inputSchema: {
      organizationId: z
        .string()
        .describe("Organization UUID from keycloak_org_list. Required."),
      idpAlias: z
        .string()
        .describe(
          'Identity provider alias from keycloak_idp_list (e.g. "contoso-sso"). Required.',
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      await new LinkOrgIdentityProviderUseCase(
        deps.organizationRepository,
      ).execute(
        OrganizationId.fromString(String(args.organizationId)),
        IdpAlias.fromString(String(args.idpAlias)),
      );
      return textResult(
        `Linked identity provider "${String(args.idpAlias)}" to organization "${String(args.organizationId)}".`,
      );
    },
  };
}

function unlinkOrgIdpTool(deps: OrgToolDeps): ToolDefinition {
  return {
    name: "keycloak_org_idp_unlink",
    title: "Unlink identity provider from organization",
    description:
      "Removes an IdP link from an organization. Destructive — requires confirm=true. Domain routing to that provider stops; the IdP itself remains in the realm.",
    level: ToolLevel.Destructive,
    inputSchema: {
      organizationId: z
        .string()
        .describe("Organization UUID from keycloak_org_list. Required."),
      idpAlias: z
        .string()
        .describe("Identity provider alias to unlink. Required."),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to proceed; when omitted or false the unlink is skipped.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new UnlinkOrgIdentityProviderUseCase(
        deps.organizationRepository,
        confirmer,
      ).execute(
        OrganizationId.fromString(String(args.organizationId)),
        IdpAlias.fromString(String(args.idpAlias)),
      );
      return textResult(
        result.unlinked
          ? `Unlinked identity provider "${String(args.idpAlias)}" from organization "${String(args.organizationId)}".`
          : `Not unlinked: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

export function buildOrgTools(deps: OrgToolDeps): ToolDefinition[] {
  return [
    listOrgsTool(deps),
    getOrgTool(deps),
    createOrgTool(deps),
    deleteOrgTool(deps),
    listOrgIdpsTool(deps),
    linkOrgIdpTool(deps),
    unlinkOrgIdpTool(deps),
  ];
}
