import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";
import type { IdpAlias } from "../../domain/shared/idp-alias.js";
import type { OrganizationId } from "../../domain/shared/organization-id.js";

export class LinkOrgIdentityProviderUseCase {
  constructor(private readonly organizations: OrganizationRepository) {}

  execute(id: OrganizationId, alias: IdpAlias): Promise<void> {
    return this.organizations.linkIdentityProvider(id, alias);
  }
}
