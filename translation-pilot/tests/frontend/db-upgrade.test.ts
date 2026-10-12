import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { openDB } from "idb";

describe("saved browser database upgrade", () => {
  it("repairs missing stores without discarding existing settings or meetings", async () => {
    const old = await openDB("mmb-v2", 1, {
      upgrade(database) {
        database.createObjectStore("settings");
        database.createObjectStore("meetings");
      },
    });
    await old.put("settings", { company: "Our team" }, "settings");
    await old.put("meetings", { title: "Yesterday" }, "meeting-1");
    const tab = new EventTarget();
    vi.stubGlobal("window", tab);
    const blocked = new Promise<void>((resolve) =>
      tab.addEventListener("mmb-db-blocked", () => resolve(), { once: true }));
    const local = await import("../../frontend/src/db");
    await blocked;
    expect(local.databaseBlocked).toBe(true);
    old.close();

    const { db } = local;
    const repaired = await db;
    expect(repaired.version).toBe(2);
    expect(await repaired.get("settings", "settings")).toEqual({ company: "Our team" });
    expect(await repaired.get("meetings", "meeting-1")).toEqual({ title: "Yesterday" });
    await repaired.put("assets", { mime: "image/png" }, "photo-1");
    expect(await repaired.get("assets", "photo-1")).toEqual({ mime: "image/png" });
    repaired.close();
    vi.unstubAllGlobals();
  });
});
