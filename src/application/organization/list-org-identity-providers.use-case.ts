import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";
import type { OrganizationId } from "../../domain/shared/organization-id.js";

export class ListOrgIdentityProvidersUseCase {
  constructor(private readonly organizations: OrganizationRepository) {}

  execute(id: OrganizationId): Promise<string[]> {
    return this.organizations.listIdentityProviders(id);
  }
}
