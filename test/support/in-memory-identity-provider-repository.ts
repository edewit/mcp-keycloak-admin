import type { IdentityProviderRepository } from "../../src/domain/ports/identity-provider-repository.js";
import type {
  IdentityProvider,
  IdentityProviderUpdate,
  IdpMapper,
  NewIdentityProvider,
} from "../../src/domain/idp/identity-provider.js";
import type { IdpAlias } from "../../src/domain/shared/idp-alias.js";

export class InMemoryIdentityProviderRepository implements IdentityProviderRepository {
  readonly created: NewIdentityProvider[] = [];
  readonly updated: { alias: string; changes: IdentityProviderUpdate }[] = [];
  readonly deletedAliases: string[] = [];
  private readonly idps: IdentityProvider[];
  private readonly mappers: IdpMapper[];

  constructor(idps: IdentityProvider[] = [], mappers: IdpMapper[] = []) {
    this.idps = idps;
    this.mappers = mappers;
  }

  list(): Promise<IdentityProvider[]> {
    return Promise.resolve(this.idps);
  }

  find(alias: IdpAlias): Promise<IdentityProvider | null> {
    return Promise.resolve(
      this.idps.find((idp) => idp.alias.equals(alias)) ?? null,
    );
  }

  create(idp: NewIdentityProvider): Promise<void> {
    this.created.push(idp);
    this.idps.push({
      alias: idp.alias,
      providerId: idp.providerId,
      enabled: idp.enabled,
      displayName: idp.displayName ?? null,
      trustEmail: idp.trustEmail === true,
    });
    return Promise.resolve();
  }

  update(alias: IdpAlias, changes: IdentityProviderUpdate): Promise<void> {
    this.updated.push({ alias: alias.toString(), changes });
    const index = this.idps.findIndex((idp) => idp.alias.equals(alias));
    if (index >= 0) {
      const current = this.idps[index]!;
      this.idps[index] = {
        ...current,
        ...(changes.enabled !== undefined ? { enabled: changes.enabled } : {}),
        ...(changes.displayName !== undefined
          ? { displayName: changes.displayName }
          : {}),
        ...(changes.trustEmail !== undefined
          ? { trustEmail: changes.trustEmail }
          : {}),
      };
    }
    return Promise.resolve();
  }

  delete(alias: IdpAlias): Promise<void> {
    this.deletedAliases.push(alias.toString());
    return Promise.resolve();
  }

  listMappers(): Promise<IdpMapper[]> {
    return Promise.resolve(this.mappers);
  }
}
