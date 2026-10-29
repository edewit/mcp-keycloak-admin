import type {
  IdentityProvider,
  IdentityProviderUpdate,
  IdpMapper,
  NewIdentityProvider,
} from "../idp/identity-provider.js";
import type { IdpAlias } from "../shared/idp-alias.js";

export interface IdentityProviderRepository {
  list(): Promise<IdentityProvider[]>;
  find(alias: IdpAlias): Promise<IdentityProvider | null>;
  create(idp: NewIdentityProvider): Promise<void>;
  update(alias: IdpAlias, changes: IdentityProviderUpdate): Promise<void>;
  delete(alias: IdpAlias): Promise<void>;
  listMappers(alias: IdpAlias): Promise<IdpMapper[]>;
}
