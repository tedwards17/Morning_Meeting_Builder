import { recalculate, media } from "../recovered/index-DwifuW9D.js";
import { APP_VERSION, defaults, upgradeDefaults } from "./defaults";
import { expireSavedMedia } from "./retention";
import { openMediaDatabase } from "./media-db";
import { startTranslation } from "./translation";
import { translationEnabled, captionGap, toggleFullscreen } from "./presentation-config";
import * as db from "./db";
import {
  insertBroadcasts,
  selectBroadcasts,
  locationUsage,
  canTemplate,
  eventKey,
} from "./domain";
import type { Row, State, Session, Usage, Broadcast } from "./types";
declare const __HOSTED__: boolean;
declare const __TRANSLATION_PILOT__: boolean;
export const hosted = __HOSTED__;
export const translationPilot = __TRANSLATION_PILOT__;
export let session: Session | null = null;
export let status = "Starting";
export let lastSync = "";
export let error = "";
const listeners = new Set<() => void>();
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function announce() {
  for (const f of listeners) f();
}
export async function api(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
) {
  const res = await fetch("./api/v1/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(session ? { "X-CSRF-Token": session.csrf } : {}),
    },
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      session = null;
      announce();
    }
    throw new Error(data.error?.message || "Request failed");
  }
  return data;
}
export async function login(username: string, password: string, name: string) {
  let id = await db.get("meta", "installation");
  if (!id) {
    id = crypto.randomUUID();
    await db.put("meta", "installation", id);
  }
  const next = await api("auth/login", {
    username,
    password,
    device_id: id,
    device_name: name,
  });
  const previous = await db.get("meta", "account");
  if (previous && previous !== next.account.id) {
    if ((await db.all("outbox")).length)
      throw new Error(
        "This browser has unsent records from another account. Sign into that account and sync first.",
      );
    await db.clearAccount();
    await db.put("meta", "installation", id);
  }
  session = next;
  await db.put("meta", "account", next.account.id);
  await db.put("meta", "offlineSession", { ...next, csrf: "" });
  await sync();
  announce();
}
export async function initialize() {
  lastSync = (await db.get("meta", "lastSync")) ?? "";
  if (hosted) {
    try {
      session = await api("auth/session");
      const prev = await db.get("meta", "account");
      if (prev && prev !== session!.account.id) {
        session = null;
        throw new Error("Sign in to change accounts safely.");
      }
      await db.put("meta", "account", session!.account.id);
      await db.put("meta", "offlineSession", { ...session, csrf: "" });
    } catch (e) {
      if (!navigator.onLine) session = await db.get("meta", "offlineSession");
      else error = String(e);
    }
  }
  const loaded = await repository.load();
  if (!hosted) {
    const expired = expireSavedMedia(loaded);
    if (expired.changed) {
      await db.saveState(expired.state);
      await discardExpiredMedia(expired.hashes);
    }
  }
  if (!hosted || session) await sync();
  announce();
}
export async function logout() {
  if ((await db.all("outbox")).length)
    throw new Error("Sync pending meetings before signing out.");
  await api("auth/logout", {});
  session = null;
  await db.clearAccount();
  location.reload();
}
export async function discardExpiredMedia(hashes: string[]) {
  if (!hashes.length) return;
  const database = await openMediaDatabase();
  for (const hash of hashes) await database.delete("assets", hash);
}
function stable(v: any): string {
  if (v === undefined) return "null";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  return (
    "{" +
    Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + stable(v[k]))
      .join(",") +
    "}"
  );
}
export const repository = {
  async load(): Promise<State> {
    let s = await db.loadState();
    if (!s) {
      if (!hosted) {
        const old = await new Promise<any>((resolve) => {
          const q = indexedDB.open("dtb-morning-meeting");
          q.onsuccess = () => {
            const d = q.result;
            if (!d.objectStoreNames.contains("state")) {
              d.close();
              resolve(null);
              return;
            }
            const r = d
              .transaction("state")
              .objectStore("state")
              .get("current");
            r.onsuccess = () => {
              d.close();
              resolve(r.result);
            };
            r.onerror = () => resolve(null);
          };
          q.onerror = () => resolve(null);
        });
        s = old ?? defaults();
      } else {
        s = defaults();
        s!.templates = [];
        s!.libraries = [];
        s!.items = [];
        s!.meetings = [];
        s!.usage = [];
      }
      s!.broadcasts = [];
      await db.saveState(s!);
    }
    if (!hosted && (s!.settings.round3DefaultsVersion !== 5 || s!.settings.appVersion !== APP_VERSION)) {
      s = upgradeDefaults(s!);
      await db.saveState(s);
    }
    if (session) {
      const sharedEvents = await db.all<Usage>("events");
      const scope =
        session.account.location_id ?? (await db.get("meta", "location")) ?? "";
      s!.usage = sharedEvents
        .filter(
          (e) =>
            e.location_id === scope && e.event_type === "content_presented",
        )
        .map((e) => ({
          id: e.id,
          meetingId: e.meeting_id,
          meetingSlideId: e.slide_id,
          contentId: e.content_id,
          deviceId: e.device_id,
          shownAt: e.occurred_at_utc,
        }));
      s!.device = {
        ...s!.device,
        id: session.device.id,
        name: session.account.location_name ?? session.account.username,
      };
      s!.settings.company = session.organization.name;
      s!.items = locationUsage(
        s!.items,
        await db.all<Usage>("events"),
        session.account.location_id ?? (await db.get("meta", "location")) ?? "",
      );
    }
    if (session) {
      const location =
        session.account.location_id ?? (await db.get("meta", "location")) ?? "";
      s!.items = locationUsage(
        s!.items,
        await db.all<Usage>("events"),
        location,
      );
      return s!;
    }
    return recalculate(s!) as State;
  },
  async save(next: State) {
    const before = await db.loadState();
    if (hosted) {
      if (!session) throw new Error("Sign in first.");
      // Legacy backup import: upload local image bytes before saving server records, then remap references.
      const remap = new Map<string, string>();
      for (let index = 0; index < next.assets.length; index++) {
        const asset = next.assets[index];
        if (
          asset.scope === "meeting-only" ||
          asset.organization_id ||
          before?.assets.some((a) => a.id === asset.id)
        )
          continue;
        if (!["image/jpeg", "image/png", "image/webp"].includes(asset.mime))
          throw new Error(
            "Hosted import accepts JPEG, PNG and WebP only. Remove local videos/GIFs from this backup first.",
          );
        const blob = await media.read(asset.hash, asset.mime);
        if (!blob) throw new Error("A backup image is missing.");
        const result = await upload(
          new File([blob], asset.name, { type: asset.mime }),
        );
        remap.set(asset.id, result.asset.id);
        next.assets[index] = result.asset;
      }
      if (remap.size) {
        const patch = (value: any): any =>
          Array.isArray(value)
            ? value.map(patch)
            : value && typeof value === "object"
              ? Object.fromEntries(
                  Object.entries(value).map(([key, v]) => [
                    key,
                    [
                      "assetId",
                      "backgroundAssetId",
                      "logoAssetId",
                      "thumbnailAssetId",
                    ].includes(key) && typeof v === "string"
                      ? (remap.get(v) ?? v)
                      : patch(v),
                  ]),
                )
              : value;
        for (const kind of ["templates", "items", "meetings"])
          next[kind] = patch(next[kind]);
      }
      const writes: Row[] = [];
      for (const kind of ["libraries", "items", "templates"])
        for (const row of next[kind]) {
          const prev = before?.[kind]?.find((r: Row) => r.id === row.id);
          const clean = (r: Row) =>
            stable({ ...r, useCount: 0, lastUsedAt: null });
          if (!prev || clean(prev) !== clean(row))
            writes.push({
              id: row.id,
              kind,
              data: row,
              expected_version: prev?.version ?? 0,
            });
        }
      if (writes.length) {
        if (!navigator.onLine)
          throw new Error(
            "Library and template edits require a connection. Your edit has not been saved.",
          );
        const response: { records: Row[] } = { records: [] };
        for (let start = 0; start < writes.length; start += 50) {
          const result = await api("records/batch", {
            records: writes.slice(start, start + 50),
          });
          response.records.push(...result.records);
        }
        for (const r of response.records) {
          const idx = next[r.kind].findIndex((x: Row) => x.id === r.id);
          next[r.kind][idx] = r.data;
        }
      }
    }
    for (const meeting of next.meetings) {
      const prior = before?.meetings.find((r) => r.id === meeting.id);
      if (JSON.stringify(prior) !== JSON.stringify(meeting)) {
        meeting.location_id =
          meeting.location_id ??
          session?.account.location_id ??
          (await db.get("meta", "location")) ??
          next.device.id;
        meeting.account_id = session?.account.id;
        meeting.device_id = next.device.id;
        meeting.organization_id = session?.account.organization_id;
        if (hosted)
          await db.put("outbox", meeting.id, {
            id: meeting.id,
            kind: "meeting",
            data: publicMeeting(meeting),
          });
        if (meeting.status === "presenting" && prior?.status !== "presenting")
          await record(meeting, null, "meeting_started");
        if (meeting.status === "completed" && prior?.status !== "completed")
          await record(meeting, null, "meeting_completed");
      }
    }
    await db.saveState(next);
    if (
      next.meetings.some(
        (m) =>
          m.status === "completed" &&
          before?.meetings.find((p) => p.id === m.id)?.status !== "completed",
      )
    )
      void sync();
    return next;
  },
};
let running: Promise<void> | undefined;
export function sync(): Promise<void> {
  if (running) return running;
  running = doSync().finally(() => {
    running = undefined;
  });
  return running;
}
async function doSync() {
  if (!hosted) {
    status = navigator.onLine
      ? translationPilot ? "Local pilot · Deepgram + Azure captions" : "Demo / Local data only"
      : "Offline · local data";
    announce();
    return;
  }
  if (!navigator.onLine) {
    status = "Offline";
    announce();
    return;
  }
  if (!session) return;
  status = "Syncing";
  error = "";
  announce();
  try {
    if (!session.csrf) session = await api("auth/session");
    const outbox = (await db.all("outbox")).sort(
      (a, b) => (a.kind === "meeting" ? 0 : 1) - (b.kind === "meeting" ? 0 : 1),
    );
    for (let i = 0; i < outbox.length; i += 50) {
      const batch = outbox
        .slice(i, i + 50)
        .sort((a, b) =>
          a.kind === "meeting" ? -1 : b.kind === "meeting" ? 1 : 0,
        );
      const res = await api("sync/push", { writes: batch });
      for (const id of res.accepted) {
        const current = await db.get("outbox", id);
        if (
          JSON.stringify(current) ===
          JSON.stringify(batch.find((x) => x.id === id))
        )
          await db.remove("outbox", id);
      }
    }
    let after = (await db.get("meta", "cursor")) ?? 0;
    let more = true;
    let page: string | null = null;
    while (more) {
      const result = await api(
        page
          ? `sync/bootstrap?page=${encodeURIComponent(page)}`
          : after
            ? `sync/changes?after=${after}`
            : "sync/bootstrap",
      );
      const d = await db.db;
      const tx = d.transaction(
        [
          "templates",
          "libraries",
          "items",
          "assets",
          "broadcasts",
          "locations",
          "organizations",
          "events",
          "usage",
          "meetings",
          "meta",
        ],
        "readwrite",
      );
      const localAssets = (await tx.objectStore("assets").getAll()).filter(
        (a: Row) => a.scope === "meeting-only",
      );
      if (result.reset)
        for (const name of [
          "templates",
          "libraries",
          "items",
          "assets",
          "broadcasts",
          "locations",
          "organizations",
          "usage",
        ])
          await tx.objectStore(name).clear();
      for (const r of result.changes) {
        const name = r.kind;
        if (!tx.objectStoreNames.contains(name)) continue;
        if (r.deleted) await tx.objectStore(name).delete(r.id);
        else {
          if (name === "meetings") {
            const local = await tx.objectStore(name).get(r.id);
            if (local && r.data.device_id === session?.device.id) {
              for (const slide of r.data.slides ?? []) {
                const original = local.slides.find(
                  (s: Row) => s.id === slide.id,
                );
                slide.items = slide.items.map((item: Row) =>
                  item.scope === "meeting-only"
                    ? (original?.items.find((i: Row) => i.id === item.id) ??
                      item)
                    : item,
                );
              }
            }
          }
          await tx.objectStore(name).put(r.data, r.id);
        }
      }
      for (const a of localAssets) await tx.objectStore("assets").put(a, a.id);
      // Commit the snapshot cursor only after its final page; interrupted snapshots restart safely.
      if (!result.next)
        await tx.objectStore("meta").put(result.cursor, "cursor");
      await tx.done;
      if (!result.next) after = result.cursor;
      page = result.next ?? null;
      more = result.more;
    }
    lastSync = new Date().toISOString();
    await db.put("meta", "lastSync", lastSync);
    status = "Synced";
    await refreshAssets();
    globalThis.MMB.events = await db.all("events");
    globalThis.MMB.locations = await db.all("locations");
    globalThis.MMB.location = await db.get("meta", "location");
    globalThis.MMB.refresh?.();
  } catch (e) {
    status = "Needs attention";
    error = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    announce();
  }
}
export async function record(
  meeting: Row,
  slide: Row | null,
  kind: string,
  content?: Row,
  reason?: string,
) {
  const key = eventKey(meeting.id, slide?.id ?? "", kind, content?.id);
  const existing = (await db.all<Usage>("events")).find(
    (e) => e.event_key === key,
  );
  if (existing) return;
  const e: Usage = {
    id: crypto.randomUUID(),
    event_key: key,
    event_type: kind,
    organization_id: session?.account.organization_id ?? "demo",
    location_id:
      meeting.location_id ??
      session?.account.location_id ??
      (await db.get("meta", "location")) ??
      (await repository.load()).device.id,
    device_id: session?.device.id ?? (await db.get("settings", "device"))?.id,
    account_id: session?.account.id ?? "demo",
    meeting_id: meeting.id,
    slide_id: slide?.id,
    content_id: content?.id,
    content_version: content?.version,
    broadcast_id: slide?.broadcast_id,
    broadcast_version: slide?.broadcast_version,
    title: content?.title ?? slide?.definition.title ?? meeting.templateName,
    content_type: content?.type,
    presenter: meeting.presenter,
    occurred_at_utc: new Date().toISOString(),
    reason,
  };
  await db.queue(e);
  if (!hosted) await db.remove("outbox", e.id);
}
export async function opened(meeting: Row, slide: Row, ids: string[]) {
  globalThis.MMB.videoEvent = (content: Row, kind: string) =>
    record(meeting, slide, kind, content);
  await record(meeting, slide, "slide_opened");
  for (const c of slide.items.filter(
    (c: Row) =>
      ids.includes(c.id) &&
      (!["external-video", "link"].includes(c.type) || navigator.onLine),
  ))
    await record(meeting, slide, "content_presented", c);
  if (
    slide.broadcast_id &&
    (!slide.items.length ||
      slide.items.some(
        (c: Row) =>
          ids.includes(c.id) &&
          (!["external-video", "link"].includes(c.type) || navigator.onLine),
      ))
  )
    await record(meeting, slide, "broadcast_presented");
}
export async function download(meeting: Row) {
  const state = await repository.load();
  const ids = new Set<string>(
    [
      meeting.theme?.backgroundAssetId,
      meeting.theme?.logoAssetId,
      ...meeting.groups.flatMap((g: Row) => [
        g.theme?.backgroundAssetId,
        g.theme?.logoAssetId,
      ]),
      ...meeting.slides.flatMap((s: Row) => [
        s.definition.backgroundAssetId,
        ...s.items.map((i: Row) => i.assetId),
      ]),
    ].filter(Boolean),
  );
  await db.put("meta", `download:${meeting.id}`, "Downloading");
  window.dispatchEvent(new Event("mmb-readiness"));
  try {
    for (const id of ids) {
      const asset = state.assets.find((a) => a.id === id);
      if (!asset) throw new Error("Missing image metadata");
      let blob = await media.read(asset.hash, asset.mime);
      if (!blob) {
        const res = await fetch(mediaUrl(asset.hash)!, {
          credentials: "same-origin",
        });
        if (!res.ok) throw new Error("Missing image");
        blob = await res.blob();
        await media.write(asset.hash, blob);
      }
      await db.put("blobs", asset.hash, {
        blob,
        used: new Date().toISOString(),
        meeting: meeting.id,
      });
    }
    await db.put("meetings", meeting.id, meeting);
    await db.put("meta", `download:${meeting.id}`, "Ready offline");
    window.dispatchEvent(new Event("mmb-readiness"));
    return "Ready offline. YouTube and external links still require internet.";
  } catch (e) {
    await db.put("meta", `download:${meeting.id}`, "Missing");
    window.dispatchEvent(new Event("mmb-readiness"));
    throw e;
  }
}
let assets: Row[] = [];
export function mediaUrl(hash: string) {
  const asset = assets.find((a) => a.hash === hash);
  return hosted && asset ? `./api/v1/media/${asset.id}` : null;
}
export async function upload(file: File) {
  if (!navigator.onLine) throw new Error("Image upload needs a connection");
  const body = new FormData();
  body.append("image", file);
  const asset = await api("media", body);
  assets.push(asset);
  return { asset, duplicate: false };
}
export async function refreshAssets() {
  assets = await db.all("assets");
}
export function broadcasts(meeting: Row, state: State) {
  if (session?.account.role === "report_viewer")
    throw new Error("This account has read-only reporting access.");
  const chosen =
    session?.account.location_id ?? globalThis.MMB.location ?? state.device.id;
  if (
    hosted &&
    session?.account.category === "individual" &&
    !globalThis.MMB.location
  )
    throw new Error(
      "Choose a meeting location in the top bar before building.",
    );
  const template = state.templates.find((t) => t.id === meeting.templateId);
  if (
    hosted &&
    session &&
    template &&
    !canTemplate(session.account, template, "use")
  )
    throw new Error(
      "This template is shared for editing only, not meeting use.",
    );
  meeting.location_id = chosen;
  const active = selectBroadcasts(
    state.broadcasts as Broadcast[],
    chosen,
    globalThis.MMB.events ?? [],
    new Date().toISOString(),
  );
  return insertBroadcasts(meeting, active);
}
export async function saveRecord(kind: string, data: Row) {
  if (hosted) {
    const res = await api("records/batch", {
      records: [
        { id: data.id, kind, data, expected_version: data.version ?? 0 },
      ],
    });
    await db.put(kind, data.id, res.records[0].data);
    await sync();
  } else await db.put(kind, data.id, data);
  globalThis.MMB.refresh?.();
  announce();
}
export function canNavigate(page: string) {
  if (!session) return true;
  if (session.account.role === "report_viewer") return ["home"].includes(page);
  if (page === "templates")
    return (
      session.account.can_create_templates ||
      session.account.role === "administrator" ||
      session.account.role === "content_manager"
    );
  return (
    (page !== "settings" && page !== "backup") ||
    session.account.role === "administrator"
  );
}
declare global {
  var MMB: any;
}
globalThis.MMB = {
  hosted,
  translationPilot,
  startTranslation,
  translationEnabled,
  captionGap,
  toggleFullscreen,
  expireMeetingState: expireSavedMedia,
  discardExpiredMedia,
  canUse: (t: Row) =>
    !hosted || !session || canTemplate(session.account, t, "use"),
  repository,
  sync: async () => {
    await sync();
    await refreshAssets();
    globalThis.MMB.events = await db.all("events");
  },
  broadcasts,
  addBroadcast: (m: Row, b: Broadcast) => ({
    ...insertBroadcasts(m, [b], [b.id]),
    broadcast_choices: m.broadcast_choices,
  }),
  meetingOnly: (title: string, description: string, libraryId?: string) => ({
    id: crypto.randomUUID(),
    libraryId: libraryId ?? crypto.randomUUID(),
    title,
    description,
    type: "lesson",
    scope: "meeting-only",
    tags: [],
    url: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: null,
    useCount: 0,
    archived: false,
    source: "Meeting-only",
  }),
  opened,
  skip: async (m: Row, s: Row, r: string) => {
    if (!r.trim()) throw new Error("A skip reason is required");
    await record(m, s, "broadcast_skipped", undefined, r);
  },
  download,
  upload,
  mediaUrl,
  canNavigate,
};
window.addEventListener("online", () => void sync().catch(() => {}));
window.addEventListener("offline", () => {
  status = "Offline";
  announce();
});
setInterval(() => {
  if (document.visibilityState === "visible") void sync().catch(() => {});
}, 60000);

function meetingAssetIds(meeting: Row): Set<string> {
  return new Set<string>(
    [
      meeting.theme?.backgroundAssetId,
      meeting.theme?.logoAssetId,
      ...(meeting.groups ?? []).flatMap((g: Row) => [
        g.theme?.backgroundAssetId,
        g.theme?.logoAssetId,
      ]),
      ...meeting.slides.flatMap((s: Row) => [
        s.definition.backgroundAssetId,
        ...s.items.map((i: Row) => i.assetId),
      ]),
    ].filter(Boolean),
  );
}
export async function readiness(meeting: Row) {
  if ((await db.get("meta", `download:${meeting.id}`)) === "Downloading")
    return "Downloading";
  const state = await repository.load();
  for (const id of meetingAssetIds(meeting)) {
    const asset = state.assets.find((a) => a.id === id);
    if (!asset || !(await media.read(asset.hash, asset.mime)))
      return "Missing — download meeting images";
  }
  return "Ready offline · YouTube and external links need internet";
}
export async function cleanDownloads() {
  const state = await repository.load();
  const retained = state.meetings
    .filter((m) => m.status !== "completed")
    .concat(
      state.meetings
        .filter((m) => m.status === "completed")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10),
    );
  const protectedIds = new Set(
    retained.flatMap((m) => [...meetingAssetIds(m)]),
  );
  const protectedHashes = new Set(
    state.assets.filter((a) => protectedIds.has(a.id)).map((a) => a.hash),
  );
  const candidates = Object.entries(
    Object.fromEntries(
      (await (await db.db).getAllKeys("blobs")).map((k) => [String(k), true]),
    ),
  ).map(([k]) => k);
  const older = [];
  for (const hash of candidates) {
    const blob = await db.get("blobs", hash);
    if (
      !protectedHashes.has(hash) &&
      Date.parse(blob.used) < Date.now() - 30 * 86400000
    )
      older.push({ hash, used: blob.used });
  }
  older.sort((a, b) => a.used.localeCompare(b.used));
  const request = indexedDB.open("dtb-morning-meeting");
  const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  for (const row of older) {
    await db.remove("blobs", row.hash);
    if (legacy.objectStoreNames.contains("assets"))
      await new Promise<void>((resolve, reject) => {
        const tx = legacy.transaction("assets", "readwrite");
        tx.objectStore("assets").delete(row.hash);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
  }
  legacy.close();
  window.dispatchEvent(new Event("mmb-readiness"));
  return `Removed ${older.length} optional image downloads older than 30 days. Drafts and the last ten completed meetings were retained.`;
}
globalThis.MMB.readiness = readiness;

function publicMeeting(meeting: Row): Row {
  const copy = structuredClone(meeting);
  for (const slide of copy.slides)
    slide.items = slide.items.map((item: Row) => {
      if (item.scope !== "meeting-only") return item;
      const clean: Row = {
        ...item,
        description: "Meeting-only content retained on the originating device.",
        url: "",
      };
      delete clean.assetId;
      delete clean.thumbnailAssetId;
      return clean;
    });
  return copy;
}
export async function meetingMedia(maxFiles = 12): Promise<Row[]> {
  const files = await new Promise<File[]>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif,video/mp4,video/webm,video/quicktime,.mov";
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = () => {
      const selected = Array.from(input.files ?? []);
      input.remove();
      resolve(selected);
    };
    input.oncancel = () => {
      input.remove();
      resolve([]);
    };
    input.click();
  });
  if (!files.length) return [];
  if (files.length > maxFiles) throw new Error(`This slide has room for ${maxFiles} more file(s). Add another media slide first.`);
  const images = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const videos = ["video/mp4", "video/webm", "video/quicktime"];
  const readyFiles: File[] = [];
  // Validate the full selection before saving any media.
  for (const original of files) {
    const extension = original.name.split(".").pop()?.toLowerCase();
    const mimeByExtension: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
      heic: "image/heic", heif: "image/heif", mp4: "video/mp4",
      webm: "video/webm", mov: "video/quicktime",
    };
    const mime = mimeByExtension[extension ?? ""];
    const file = mime && original.type !== mime
      ? new File([original], original.name, { type: mime }) : original;
    if (file.size === 0) throw new Error(`${file.name}: empty files cannot be imported.`);
    if (!images.includes(file.type) && !videos.includes(file.type))
      throw new Error(`${file.name}: choose a JPEG, PNG, WebP, HEIC, HEIF, MP4, WebM, or MOV file.`);
    if (file.size > (images.includes(file.type) ? 25 : 150) * 1024 * 1024)
      throw new Error(`${file.name}: image limit 25 MB; video limit 150 MB.`);
    if (images.includes(file.type)) {
      let image: ImageBitmap | HTMLImageElement;
      let closeImage = () => {};
      try {
        if (typeof createImageBitmap !== "function") throw new Error("Bitmap decoding unavailable");
        const bitmap = await createImageBitmap(file);
        image = bitmap;
        closeImage = () => bitmap.close();
      } catch {
        // Some mobile browsers display JPEGs but reject createImageBitmap(File).
        const url = URL.createObjectURL(file);
        try {
          image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error("Image could not be decoded"));
            element.src = url;
          });
          closeImage = () => URL.revokeObjectURL(url);
        } catch {
          URL.revokeObjectURL(url);
          throw new Error(`${file.name}: this browser cannot display this image. Try a JPEG or a screenshot.`);
        }
      }
      const width = "naturalWidth" in image ? image.naturalWidth : image.width;
      const height = "naturalHeight" in image ? image.naturalHeight : image.height;
      const tooLarge = width * height > 100_000_000;
      if (tooLarge) {
        closeImage();
        throw new Error(`${file.name}: image exceeds 100 megapixels.`);
      }
      if (["image/heic", "image/heif", "image/jpeg"].includes(file.type) &&
          (file.type !== "image/jpeg" || width > 2560 || height > 1600 || file.size > 5 * 1024 * 1024)) {
        // Convert HEIC and scale large camera photos for reliable local storage.
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 2560 / width, 1600 / height);
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          closeImage();
          throw new Error(`${file.name}: could not prepare this photo for conversion.`);
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        closeImage();
        const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
        if (!jpeg) throw new Error(`${file.name}: could not convert this photo to JPEG.`);
        readyFiles.push(new File([jpeg], file.name.replace(/\.(heic|heif|jpe?g)$/i, "") + ".jpg", { type: "image/jpeg" }));
      } else {
        closeImage();
        readyFiles.push(file);
      }
    } else {
      readyFiles.push(file);
    }
  }
  const result: Row[] = [];
  const assets: Row[] = [];
  for (const file of readyFiles) {
    const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))]
      .map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const asset = {
      id: crypto.randomUUID(), hash, name: file.name, mime: file.type,
      size: file.size, createdAt: new Date().toISOString(), scope: "meeting-only",
    };
    await media.write(hash, file);
    assets.push(asset);
    result.push({
      ...globalThis.MMB.meetingOnly(file.name, "", "00000000-0000-4000-8000-000000000006"),
      type: file.type.startsWith("video/") ? "video" : "image-text",
      assetId: asset.id,
    });
  }
  // Save metadata only after every selected file has been written. Rewriting the
  // whole app state here could overwrite a draft being saved at the same time.
  if (globalThis.MMB.addMediaAssets) await globalThis.MMB.addMediaAssets(assets);
  else for (const asset of assets) await db.put("assets", asset.id, asset);
  globalThis.MMB.refresh?.();
  return result;
}
globalThis.MMB.meetingMedia = meetingMedia;
// Kept for older builder integrations.
globalThis.MMB.meetingImage = async () => (await meetingMedia())[0];
