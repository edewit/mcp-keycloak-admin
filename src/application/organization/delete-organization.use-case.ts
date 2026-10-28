import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";
import type { OrganizationId } from "../../domain/shared/organization-id.js";

export interface DeleteOrganizationResult {
  readonly deleted: boolean;
  readonly reason?: string;
}

export class DeleteOrganizationUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(id: OrganizationId): Promise<DeleteOrganizationResult> {
    const operation = DestructiveOperation.of(
      `Delete organization ${id.toString()}`,
      "Domains and identity-provider links on this organization are removed. Domain-based SSO routing stops for those domains.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { deleted: false, reason: "Operation not confirmed" };
    }
    await this.organizations.delete(id);
    return { deleted: true };
  }
}
