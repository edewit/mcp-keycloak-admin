import type {
  NewOrganization,
  Organization,
} from "../../src/domain/organization/organization.js";
import type { OrganizationRepository } from "../../src/domain/ports/organization-repository.js";
import type { IdpAlias } from "../../src/domain/shared/idp-alias.js";
import { OrganizationId } from "../../src/domain/shared/organization-id.js";

export class InMemoryOrganizationRepository implements OrganizationRepository {
  readonly created: NewOrganization[] = [];
  readonly deleted: string[] = [];
  readonly linked: { id: string; alias: string }[] = [];
  readonly unlinked: { id: string; alias: string }[] = [];
  private readonly orgs: Organization[];
  private readonly idpsByOrg = new Map<string, string[]>();
  private nextId = 1;

  constructor(orgs: Organization[] = []) {
    this.orgs = [...orgs];
    for (const org of orgs) {
      this.idpsByOrg.set(org.id.toString(), []);
    }
  }

  list(): Promise<Organization[]> {
    return Promise.resolve([...this.orgs]);
  }

  find(id: OrganizationId): Promise<Organization | null> {
    return Promise.resolve(this.orgs.find((org) => org.id.equals(id)) ?? null);
  }

  create(organization: NewOrganization): Promise<Organization> {
    this.created.push(organization);
    const id = OrganizationId.fromString(
      `00000000-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`,
    );
    const created: Organization = {
      id,
      name: organization.name,
      alias: organization.alias ?? organization.name,
      enabled: organization.enabled !== false,
      description: organization.description ?? null,
      domains: organization.domains,
    };
    this.orgs.push(created);
    this.idpsByOrg.set(id.toString(), []);
    return Promise.resolve(created);
  }

  delete(id: OrganizationId): Promise<void> {
    this.deleted.push(id.toString());
    const index = this.orgs.findIndex((org) => org.id.equals(id));
    if (index >= 0) {
      this.orgs.splice(index, 1);
    }
    this.idpsByOrg.delete(id.toString());
    return Promise.resolve();
  }

  listIdentityProviders(id: OrganizationId): Promise<string[]> {
    return Promise.resolve([...(this.idpsByOrg.get(id.toString()) ?? [])]);
  }

  linkIdentityProvider(id: OrganizationId, alias: IdpAlias): Promise<void> {
    this.linked.push({ id: id.toString(), alias: alias.toString() });
    const list = this.idpsByOrg.get(id.toString()) ?? [];
    if (!list.includes(alias.toString())) {
      list.push(alias.toString());
    }
    this.idpsByOrg.set(id.toString(), list);
    return Promise.resolve();
  }

  unlinkIdentityProvider(id: OrganizationId, alias: IdpAlias): Promise<void> {
    this.unlinked.push({ id: id.toString(), alias: alias.toString() });
    const list = this.idpsByOrg.get(id.toString()) ?? [];
    this.idpsByOrg.set(
      id.toString(),
      list.filter((entry) => entry !== alias.toString()),
    );
    return Promise.resolve();
  }
}
