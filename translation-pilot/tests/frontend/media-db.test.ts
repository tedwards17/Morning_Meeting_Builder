import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { openDB } from "idb";
import { openMediaDatabase } from "../../frontend/src/media-db";

describe("legacy browser media upgrade", () => {
  it("repairs a version-1 database without assets and preserves saved state", async () => {
    const old = await openDB("dtb-morning-meeting", 1, {
      upgrade(database) { database.createObjectStore("state"); },
    });
    await old.put("state", { meeting: "existing" }, "current");
    old.close();

    const repaired = await openMediaDatabase();
    expect(repaired.version).toBe(2);
    expect(repaired.objectStoreNames.contains("assets")).toBe(true);
    expect(await repaired.get("state", "current")).toEqual({ meeting: "existing" });

    const png = new Uint8Array([137, 80, 78, 71]);
    await repaired.put("assets", png, "photo-hash");
    expect(await repaired.get("assets", "photo-hash")).toEqual(png);
    repaired.close();
  });
});
