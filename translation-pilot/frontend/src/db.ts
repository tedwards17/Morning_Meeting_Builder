import { openDB } from "idb";
import type { Row, State } from "./types";
const stores = [
  "settings",
  "organizations",
  "locations",
  "libraries",
  "items",
  "assets",
  "templates",
  "template_versions",
  "broadcasts",
  "meetings",
  "slides",
  "usage",
  "events",
  "outbox",
  "meta",
  "blobs",
];
// Earlier browser builds could create this database without every store. An
// upgrade repairs its schema without clearing saved meetings or preferences.
export let databaseBlocked = false;
export const db = openDB("mmb-v2", 2, {
  upgrade(db) {
    for (const s of stores)
      if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
  },
  blocked() {
    databaseBlocked = true;
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mmb-db-blocked"));
  },
  blocking() {
    // Let another open tab finish a later database upgrade without losing data.
    void db.then((connection) => connection.close());
  },
});
export async function get<T = any>(store: string, key: string): Promise<T> {
  return (await db).get(store, key);
}
export async function put(store: string, key: string, value: unknown) {
  await (await db).put(store, value, key);
}
export async function all<T = Row>(store: string): Promise<T[]> {
  return (await db).getAll(store);
}
export async function remove(store: string, key: string) {
  await (await db).delete(store, key);
}
export async function saveState(state: State) {
  const d = await db;
  const names = [
    "templates",
    "libraries",
    "items",
    "assets",
    "meetings",
    "usage",
    "broadcasts",
  ];
  const tx = d.transaction([...names, "settings"], "readwrite");
  for (const name of names) {
    await tx.objectStore(name).clear();
    for (const row of state[name] ?? [])
      await tx.objectStore(name).put(row, row.id);
  }
  await tx.objectStore("settings").put(state.settings, "settings");
  await tx.objectStore("settings").put(state.device, "device");
  await tx.done;
}
export async function loadState(): Promise<State | null> {
  const settings = await get("settings", "settings");
  if (!settings) return null;
  const state: any = {
    schemaVersion: 1,
    settings,
    device: await get("settings", "device"),
  };
  for (const s of [
    "templates",
    "libraries",
    "items",
    "assets",
    "meetings",
    "usage",
    "broadcasts",
  ])
    state[s] = await all(s);
  return state;
}
export async function queue(event: Row) {
  const d = await db;
  const tx = d.transaction(["events", "outbox"], "readwrite");
  if (!(await tx.objectStore("events").get(event.id))) {
    await tx.objectStore("events").put(event, event.id);
    await tx
      .objectStore("outbox")
      .put({ id: event.id, kind: "event", data: event }, event.id);
  }
  await tx.done;
}
export async function clearAccount() {
  const d = await db;
  const tx = d.transaction(stores, "readwrite");
  for (const s of stores) await tx.objectStore(s).clear();
  await tx.done;
}
