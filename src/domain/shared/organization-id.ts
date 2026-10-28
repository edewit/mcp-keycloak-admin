import { ensureUuid } from "./guards.js";

export class OrganizationId {
  private constructor(private readonly value: string) {}

  static fromString(value: string): OrganizationId {
    return new OrganizationId(ensureUuid(value, "OrganizationId"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }
}
