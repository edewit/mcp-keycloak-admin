import type {
  NewOrganization,
  Organization,
} from "../organization/organization.js";
import type { IdpAlias } from "../shared/idp-alias.js";
import type { OrganizationId } from "../shared/organization-id.js";

export interface OrganizationRepository {
  list(): Promise<Organization[]>;
  find(id: OrganizationId): Promise<Organization | null>;
  create(organization: NewOrganization): Promise<Organization>;
  delete(id: OrganizationId): Promise<void>;
  listIdentityProviders(id: OrganizationId): Promise<string[]>;
  linkIdentityProvider(id: OrganizationId, alias: IdpAlias): Promise<void>;
  unlinkIdentityProvider(id: OrganizationId, alias: IdpAlias): Promise<void>;
}
