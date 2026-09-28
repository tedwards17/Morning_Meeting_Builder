import type { Row, State } from "./types";

// A September 25 meeting stays available through 11:59 p.m. September 26
// in the browser's local time zone, including across daylight saving changes.
export function meetingExpiresAt(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return Infinity;
  const [year, month, day] = match.slice(1).map(Number);
  const start = new Date(year, month - 1, day);
  if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day)
    return Infinity;
  return new Date(year, month - 1, day + 2).getTime();
}

export function isMeetingExpired(meeting: Row, now = Date.now()): boolean {
  return meeting.status === "completed" && now >= meetingExpiresAt(meeting.date);
}

function collectReferences(meeting: Row, ids: Set<string>) {
  for (const id of [meeting.theme?.backgroundAssetId, meeting.theme?.logoAssetId,
    ...(meeting.groups ?? []).flatMap((group: Row) => [group.theme?.backgroundAssetId, group.theme?.logoAssetId])])
    if (id) ids.add(id);
  for (const slide of meeting.slides ?? []) {
    if (slide.definition?.backgroundAssetId) ids.add(slide.definition.backgroundAssetId);
    for (const item of slide.items ?? [])
      for (const id of [item.assetId, item.thumbnailAssetId]) if (id) ids.add(id);
  }
}

export function expireSavedMedia(state: State, now = Date.now()): {
  state: State; hashes: string[]; changed: boolean;
} {
  const expired = state.meetings.filter((meeting) => isMeetingExpired(meeting, now) && !meeting.mediaExpiredAt);
  if (!expired.length) return { state, hashes: [], changed: false };
  const candidates = new Set<string>();
  for (const meeting of expired)
    for (const slide of meeting.slides ?? [])
      for (const item of slide.items ?? [])
        if (item.scope === "meeting-only")
          for (const id of [item.assetId, item.thumbnailAssetId]) if (id) candidates.add(id);

  const meetings = state.meetings.map((meeting) => isMeetingExpired(meeting, now) && !meeting.mediaExpiredAt
    ? { ...meeting, mediaExpiredAt: new Date(now).toISOString(),
      slides: meeting.slides.map((slide: Row) => ({ ...slide,
        items: slide.items.filter((item: Row) => item.scope !== "meeting-only"),
      })) }
    : meeting);
  const references = new Set<string>();
  for (const meeting of meetings) collectReferences(meeting, references);
  for (const item of state.items)
    for (const id of [item.assetId, item.thumbnailAssetId]) if (id) references.add(id);
  for (const template of state.templates) {
    for (const id of [template.theme?.backgroundAssetId, template.theme?.logoAssetId,
      ...(template.groups ?? []).flatMap((group: Row) => [group.theme?.backgroundAssetId, group.theme?.logoAssetId]),
      ...(template.slides ?? []).map((slide: Row) => slide.backgroundAssetId)])
      if (id) references.add(id);
  }
  for (const broadcast of state.broadcasts ?? [])
    for (const id of [broadcast.content?.assetId, broadcast.content?.thumbnailAssetId])
      if (id) references.add(id);

  const removed = state.assets.filter((asset) => asset.scope === "meeting-only" &&
    candidates.has(asset.id) && !references.has(asset.id));
  const removedIds = new Set(removed.map((asset) => asset.id));
  const assets = state.assets.filter((asset) => !removedIds.has(asset.id));
  const retainedHashes = new Set(assets.map((asset) => asset.hash));
  const hashes = [...new Set(removed.map((asset) => asset.hash))]
    .filter((hash) => hash && !retainedHashes.has(hash));
  return { state: { ...state, meetings, assets }, hashes, changed: true };
}
