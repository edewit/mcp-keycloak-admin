import type { IdentityProviderUpdate } from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import type { IdpAlias } from "../../domain/shared/idp-alias.js";

export interface UpdateIdentityProviderResult {
  readonly updated: boolean;
  readonly reason?: string;
}

export class UpdateIdentityProviderUseCase {
  constructor(private readonly idps: IdentityProviderRepository) {}

  async execute(
    alias: IdpAlias,
    changes: IdentityProviderUpdate,
  ): Promise<UpdateIdentityProviderResult> {
    const existing = await this.idps.find(alias);
    if (existing === null) {
      return { updated: false, reason: "Identity provider not found" };
    }
    await this.idps.update(alias, changes);
    return { updated: true };
  }
}
