import { describe, expect, it } from "vitest";

import { UpdateRealmConfigUseCase } from "../../../src/application/realm/update-realm-config.use-case.js";
import type { RealmInfo } from "../../../src/domain/ports/realm-info.js";
import type { RealmConfigPatch } from "../../../src/domain/realm/realm-config.js";

describe("UpdateRealmConfigUseCase", () => {
  it("rejects an empty patch", async () => {
    const realm: RealmInfo = {
      getRealmConfig: () => Promise.resolve({}),
      updateRealmConfig: () => Promise.resolve(),
      serverInfo: () => Promise.resolve({}),
    };
    await expect(
      new UpdateRealmConfigUseCase(realm).execute({}),
    ).rejects.toThrow(
      /smtpServer|webAuthnPasswordlessPolicy|organizationsEnabled|acrLoaMap/,
    );
  });

  it("forwards organizationsEnabled", async () => {
    const patches: RealmConfigPatch[] = [];
    const realm: RealmInfo = {
      getRealmConfig: () => Promise.resolve({}),
      updateRealmConfig: (patch) => {
        patches.push(patch);
        return Promise.resolve();
      },
      serverInfo: () => Promise.resolve({}),
    };
    await new UpdateRealmConfigUseCase(realm).execute({
      organizationsEnabled: true,
    });
    expect(patches[0]?.organizationsEnabled).toBe(true);
  });

  it("forwards a smtp patch", async () => {
    const patches: RealmConfigPatch[] = [];
    const realm: RealmInfo = {
      getRealmConfig: () => Promise.resolve({}),
      updateRealmConfig: (patch) => {
        patches.push(patch);
        return Promise.resolve();
      },
      serverInfo: () => Promise.resolve({}),
    };
    await new UpdateRealmConfigUseCase(realm).execute({
      smtpServer: { host: "mail", from: "a@b.c" },
    });
    expect(patches[0]?.smtpServer?.host).toBe("mail");
  });
});
