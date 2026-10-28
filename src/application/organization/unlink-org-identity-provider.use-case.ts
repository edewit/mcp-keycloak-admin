import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { OrganizationRepository } from "../../domain/ports/organization-repository.js";
import type { IdpAlias } from "../../domain/shared/idp-alias.js";
import type { OrganizationId } from "../../domain/shared/organization-id.js";

export interface UnlinkOrgIdentityProviderResult {
  readonly unlinked: boolean;
  readonly reason?: string;
}

export class UnlinkOrgIdentityProviderUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(
    id: OrganizationId,
    alias: IdpAlias,
  ): Promise<UnlinkOrgIdentityProviderResult> {
    const operation = DestructiveOperation.of(
      `Unlink identity provider ${alias.toString()} from organization ${id.toString()}`,
      "Domain-based routing to this provider stops for the organization's verified domains.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { unlinked: false, reason: "Operation not confirmed" };
    }
    await this.organizations.unlinkIdentityProvider(id, alias);
    return { unlinked: true };
  }
}
