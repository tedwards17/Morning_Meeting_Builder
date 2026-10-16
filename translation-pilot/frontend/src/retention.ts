import type { Row, State } from "./types";

// Kept as a compatibility export; meeting media no longer expires by scheduled date.
export function meetingExpiresAt(_date: string): number { return Infinity; }
export function isMeetingExpired(meeting: Row, _now = Date.now()): boolean {
  return meeting.status === "completed" && Boolean(meeting.mediaExpiredAt);
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
  const expired = state.meetings.filter((meeting) => meeting.status === "completed" && !meeting.mediaExpiredAt);
  if (!expired.length) return { state, hashes: [], changed: false };
  const candidates = new Set<string>();
  for (const meeting of expired)
    for (const slide of meeting.slides ?? [])
      for (const item of slide.items ?? [])
        if (item.scope === "meeting-only")
          for (const id of [item.assetId, item.thumbnailAssetId]) if (id) candidates.add(id);

  const meetings = state.meetings.map((meeting) => meeting.status === "completed" && !meeting.mediaExpiredAt
    ? { ...meeting, mediaExpiredAt: new Date(now).toISOString(), mediaCleanupConfirmed: true,
      slides: meeting.slides.map((slide: Row) => ({ ...slide,
        items: slide.items.map((item:Row)=>{
          if(item.scope!=="meeting-only")return item;
          const cleaned:Row={...item,url:"",mediaDeleted:true};delete cleaned.assetId;delete cleaned.thumbnailAssetId;return cleaned;
        }),
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
