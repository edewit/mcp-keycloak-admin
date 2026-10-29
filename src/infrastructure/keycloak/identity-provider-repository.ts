import type {
  IdentityProvider,
  IdentityProviderUpdate,
  IdpMapper,
  NewIdentityProvider,
} from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import { IdpAlias } from "../../domain/shared/idp-alias.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { KeycloakError } from "./errors.js";

interface KeycloakIdp {
  readonly alias: string;
  readonly providerId?: string;
  readonly enabled?: boolean;
  readonly displayName?: string;
  readonly trustEmail?: boolean;
  readonly config?: Record<string, string>;
  readonly [key: string]: unknown;
}

interface KeycloakIdpMapper {
  readonly id: string;
  readonly name: string;
  readonly identityProviderMapper?: string;
}

function toIdp(raw: KeycloakIdp): IdentityProvider {
  return {
    alias: IdpAlias.fromString(raw.alias),
    providerId: raw.providerId ?? "unknown",
    enabled: raw.enabled ?? false,
    displayName: raw.displayName ?? null,
    trustEmail: raw.trustEmail === true,
  };
}

export class KeycloakIdentityProviderRepository implements IdentityProviderRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async list(): Promise<IdentityProvider[]> {
    const raw = await this.client.getJson<KeycloakIdp[]>(
      "/identity-provider/instances",
    );
    return raw.map(toIdp);
  }

  async find(alias: IdpAlias): Promise<IdentityProvider | null> {
    try {
      const raw = await this.client.getJson<KeycloakIdp>(
        `/identity-provider/instances/${alias.toString()}`,
      );
      return toIdp(raw);
    } catch (error) {
      if (error instanceof KeycloakError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  create(idp: NewIdentityProvider): Promise<void> {
    return this.client.post("/identity-provider/instances", {
      alias: idp.alias.toString(),
      providerId: idp.providerId,
      enabled: idp.enabled,
      ...(idp.displayName !== undefined
        ? { displayName: idp.displayName }
        : {}),
      ...(idp.trustEmail !== undefined ? { trustEmail: idp.trustEmail } : {}),
      config: idp.config,
    });
  }

  async update(
    alias: IdpAlias,
    changes: IdentityProviderUpdate,
  ): Promise<void> {
    const path = `/identity-provider/instances/${alias.toString()}`;
    const current = await this.client.getJson<KeycloakIdp>(path);
    const merged: Record<string, unknown> = { ...current };
    if (changes.enabled !== undefined) {
      merged.enabled = changes.enabled;
    }
    if (changes.displayName !== undefined) {
      merged.displayName = changes.displayName;
    }
    if (changes.trustEmail !== undefined) {
      merged.trustEmail = changes.trustEmail;
    }
    if (changes.config !== undefined) {
      merged.config = {
        ...(typeof current.config === "object" && current.config !== null
          ? current.config
          : {}),
        ...changes.config,
      };
    }
    await this.client.put(path, merged);
  }

  delete(alias: IdpAlias): Promise<void> {
    return this.client.delete(
      `/identity-provider/instances/${alias.toString()}`,
    );
  }

  async listMappers(alias: IdpAlias): Promise<IdpMapper[]> {
    const raw = await this.client.getJson<KeycloakIdpMapper[]>(
      `/identity-provider/instances/${alias.toString()}/mappers`,
    );
    return raw.map((mapper) => ({
      id: mapper.id,
      name: mapper.name,
      type: mapper.identityProviderMapper ?? "unknown",
    }));
  }
}
