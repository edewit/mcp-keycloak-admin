import type { RealmConfigPatch } from "../realm/realm-config.js";

export interface RealmInfo {
  getRealmConfig(): Promise<Record<string, unknown>>;
  updateRealmConfig(patch: RealmConfigPatch): Promise<void>;
  serverInfo(): Promise<Record<string, unknown>>;
}
