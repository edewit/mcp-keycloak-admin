import type {
  NewOrganization,
  Organization,
  OrganizationDomain,
} from "../../domain/organization/organization.js";
import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";
import type { IdpAlias } from "../../domain/shared/idp-alias.js";
import { OrganizationId } from "../../domain/shared/organization-id.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { KeycloakError } from "./errors.js";

interface KeycloakOrgDomain {
  readonly name?: string;
  readonly verified?: boolean;
}

interface KeycloakOrganization {
  readonly id: string;
  readonly name?: string;
  readonly alias?: string;
  readonly enabled?: boolean;
  readonly description?: string;
  readonly domains?: readonly KeycloakOrgDomain[];
}

interface KeycloakOrgIdp {
  readonly alias?: string;
}

function toDomains(
  raw: readonly KeycloakOrgDomain[] | undefined,
): OrganizationDomain[] {
  if (raw === undefined) {
    return [];
  }
  return raw
    .filter(
      (domain) => typeof domain.name === "string" && domain.name.length > 0,
    )
    .map((domain) => ({
      name: domain.name as string,
      verified: domain.verified === true,
    }));
}

function toOrganization(raw: KeycloakOrganization): Organization {
  return {
    id: OrganizationId.fromString(raw.id),
    name: raw.name ?? "",
    alias: raw.alias ?? raw.name ?? "",
    enabled: raw.enabled ?? false,
    description: raw.description ?? null,
    domains: toDomains(raw.domains),
  };
}

export class KeycloakOrganizationRepository implements OrganizationRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async list(): Promise<Organization[]> {
    const raw = await this.client.list<KeycloakOrganization>("/organizations");
    return raw.map(toOrganization);
  }

  async find(id: OrganizationId): Promise<Organization | null> {
    try {
      const raw = await this.client.getJson<KeycloakOrganization>(
        `/organizations/${id.toString()}`,
      );
      return toOrganization(raw);
    } catch (error) {
      if (error instanceof KeycloakError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(organization: NewOrganization): Promise<Organization> {
    await this.client.post("/organizations", {
      name: organization.name,
      alias: organization.alias ?? organization.name,
      enabled: organization.enabled !== false,
      ...(organization.description !== undefined
        ? { description: organization.description }
        : {}),
      domains: organization.domains.map((domain) => ({
        name: domain.name,
        verified: domain.verified,
      })),
    });
    const created = (await this.list()).find(
      (candidate) => candidate.name === organization.name,
    );
    if (created === undefined) {
      throw new Error(
        `Organization "${organization.name}" was created but could not be re-read`,
      );
    }
    return created;
  }

  delete(id: OrganizationId): Promise<void> {
    return this.client.delete(`/organizations/${id.toString()}`);
  }

  async listIdentityProviders(id: OrganizationId): Promise<string[]> {
    const raw = await this.client.getJson<KeycloakOrgIdp[]>(
      `/organizations/${id.toString()}/identity-providers`,
    );
    return raw
      .map((idp) => idp.alias)
      .filter((alias): alias is string => typeof alias === "string");
  }

  linkIdentityProvider(id: OrganizationId, alias: IdpAlias): Promise<void> {
    // Keycloak expects a bare JSON string of the alias, not an object.
    return this.client.post(
      `/organizations/${id.toString()}/identity-providers`,
      alias.toString(),
    );
  }

  unlinkIdentityProvider(id: OrganizationId, alias: IdpAlias): Promise<void> {
    return this.client.delete(
      `/organizations/${id.toString()}/identity-providers/${alias.toString()}`,
    );
  }
}
