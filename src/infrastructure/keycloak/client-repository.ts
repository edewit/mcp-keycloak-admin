import type { ClientSummary } from "../../domain/client/client-summary.js";
import type {
  ClientUpdate,
  NewClient,
} from "../../domain/client/new-client.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import { ClientId } from "../../domain/shared/client-id.js";
import { ClientSecret } from "../../domain/shared/client-secret.js";
import { ClientUuid } from "../../domain/shared/client-uuid.js";
import type { KeycloakAdminClient } from "./admin-client.js";

interface KeycloakClientRep {
  readonly id: string;
  readonly clientId: string;
  readonly enabled?: boolean;
  readonly publicClient?: boolean;
  readonly redirectUris?: string[];
  readonly webOrigins?: string[];
  readonly attributes?: Record<string, string>;
  readonly authenticationFlowBindingOverrides?: Record<string, string>;
  readonly [key: string]: unknown;
}

interface SecretRep {
  readonly value: string;
}

function stringMap(
  value: Record<string, string> | undefined,
): Record<string, string> {
  if (value === undefined) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      out[key] = entry;
    }
  }
  return out;
}

function toSummary(raw: KeycloakClientRep): ClientSummary {
  return {
    uuid: ClientUuid.fromString(raw.id),
    clientId: ClientId.fromString(raw.clientId),
    enabled: raw.enabled ?? false,
    publicClient: raw.publicClient ?? false,
    redirectUris: raw.redirectUris ?? [],
    webOrigins: raw.webOrigins ?? [],
    attributes: stringMap(raw.attributes),
    authenticationFlowBindingOverrides: stringMap(
      raw.authenticationFlowBindingOverrides,
    ),
  };
}

export class KeycloakClientRepository implements ClientRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async list(): Promise<ClientSummary[]> {
    const raw = await this.client.list<KeycloakClientRep>("/clients");
    return raw.map(toSummary);
  }

  async findByClientId(clientId: ClientId): Promise<ClientSummary | null> {
    const raw = await this.client.getJson<KeycloakClientRep[]>("/clients", {
      clientId: clientId.toString(),
    });
    const first = raw[0];
    return first === undefined ? null : toSummary(first);
  }

  async getSecret(uuid: ClientUuid): Promise<ClientSecret> {
    const raw = await this.client.getJson<SecretRep>(
      `/clients/${uuid.toString()}/client-secret`,
    );
    return ClientSecret.fromString(raw.value);
  }

  async regenerateSecret(uuid: ClientUuid): Promise<ClientSecret> {
    const raw = await this.client.postJson<SecretRep>(
      `/clients/${uuid.toString()}/client-secret`,
    );
    return ClientSecret.fromString(raw.value);
  }

  create(client: NewClient): Promise<void> {
    return this.client.post("/clients", {
      clientId: client.clientId.toString(),
      enabled: client.enabled,
      publicClient: client.publicClient,
      redirectUris: client.redirectUris,
      webOrigins: client.webOrigins,
    });
  }

  async update(uuid: ClientUuid, changes: ClientUpdate): Promise<void> {
    // Keycloak client PUT blanks omitted fields — always read-merge-write.
    const current = await this.client.getJson<KeycloakClientRep>(
      `/clients/${uuid.toString()}`,
    );
    const merged: Record<string, unknown> = { ...current };
    if (changes.enabled !== undefined) {
      merged.enabled = changes.enabled;
    }
    if (changes.publicClient !== undefined) {
      merged.publicClient = changes.publicClient;
    }
    if (changes.redirectUris !== undefined) {
      merged.redirectUris = changes.redirectUris;
    }
    if (changes.webOrigins !== undefined) {
      merged.webOrigins = changes.webOrigins;
    }
    if (changes.attributes !== undefined) {
      merged.attributes = {
        ...stringMap(current.attributes),
        ...changes.attributes,
      };
    }
    if (changes.authenticationFlowBindingOverrides !== undefined) {
      const overrides = {
        ...stringMap(current.authenticationFlowBindingOverrides),
      };
      for (const [key, value] of Object.entries(
        changes.authenticationFlowBindingOverrides,
      )) {
        if (value === "") {
          delete overrides[key];
        } else {
          overrides[key] = value;
        }
      }
      merged.authenticationFlowBindingOverrides = overrides;
    }
    await this.client.put(`/clients/${uuid.toString()}`, merged);
  }

  delete(uuid: ClientUuid): Promise<void> {
    return this.client.delete(`/clients/${uuid.toString()}`);
  }
}
