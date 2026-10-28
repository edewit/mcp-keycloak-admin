import type {
  NewOrganization,
  Organization,
} from "../../domain/organization/organization.js";
import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";

export class CreateOrganizationUseCase {
  constructor(private readonly organizations: OrganizationRepository) {}

  execute(organization: NewOrganization): Promise<Organization> {
    return this.organizations.create(organization);
  }
}
