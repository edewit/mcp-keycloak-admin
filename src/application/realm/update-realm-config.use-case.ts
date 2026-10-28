import type { RealmInfo } from "../../domain/ports/realm-info.js";
import type { RealmConfigPatch } from "../../domain/realm/realm-config.js";

export class UpdateRealmConfigUseCase {
  constructor(private readonly realm: RealmInfo) {}

  async execute(patch: RealmConfigPatch): Promise<void> {
    if (
      patch.smtpServer === undefined &&
      patch.webAuthnPasswordlessPolicy === undefined &&
      patch.organizationsEnabled === undefined
    ) {
      throw new Error(
        "Realm update requires smtpServer, webAuthnPasswordlessPolicy, and/or organizationsEnabled",
      );
    }
    await this.realm.updateRealmConfig(patch);
  }
}
