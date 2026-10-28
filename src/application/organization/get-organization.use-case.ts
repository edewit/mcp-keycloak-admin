import type { Organization } from "../../domain/organization/organization.js";
import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";
import type { OrganizationId } from "../../domain/shared/organization-id.js";

export class GetOrganizationUseCase {
  constructor(private readonly organizations: OrganizationRepository) {}

  execute(id: OrganizationId): Promise<Organization | null> {
    return this.organizations.find(id);
  }
}
