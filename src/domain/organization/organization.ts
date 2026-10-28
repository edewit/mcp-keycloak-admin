import type { OrganizationId } from "../shared/organization-id.js";
import { ensureNonBlank } from "../shared/guards.js";

export interface OrganizationDomain {
  readonly name: string;
  readonly verified: boolean;
}

export interface Organization {
  readonly id: OrganizationId;
  readonly name: string;
  readonly alias: string;
  readonly enabled: boolean;
  readonly description: string | null;
  readonly domains: readonly OrganizationDomain[];
}

export interface NewOrganization {
  readonly name: string;
  readonly alias?: string;
  readonly enabled?: boolean;
  readonly description?: string;
  readonly domains: readonly OrganizationDomain[];
}

export function organizationDomainFrom(
  name: string,
  verified = true,
): OrganizationDomain {
  return { name: ensureNonBlank(name, "domain name"), verified };
}
