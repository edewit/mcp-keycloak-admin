import type { Organization } from "../../domain/organization/organization.js";
import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";

export class ListOrganizationsUseCase {
  constructor(private readonly organizations: OrganizationRepository) {}

  execute(): Promise<Organization[]> {
    return this.organizations.list();
  }
}
