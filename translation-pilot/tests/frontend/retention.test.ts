import { describe, expect, it } from "vitest";
import { defaults } from "../../frontend/src/defaults";
import { expireSavedMedia, isMeetingExpired, meetingExpiresAt } from "../../frontend/src/retention";

describe("completed presentation replay and media retention", () => {
  it("keeps uncompleted media indefinitely and expires only after completion",()=>{
    expect(meetingExpiresAt("2026-09-25")).toBe(Infinity);
    expect(isMeetingExpired({status:"draft",date:"2026-09-25"},Date.now())).toBe(false);
    expect(isMeetingExpired({status:"presenting",date:"2026-09-25"},Date.now())).toBe(false);
    expect(isMeetingExpired({status:"completed",mediaExpiredAt:"2026-10-16T00:00:00Z"})).toBe(true);
  });

  it("removes expired meeting-only media without deleting a file shared by an active draft", () => {
    const state = defaults();
    const item = { id: crypto.randomUUID(), type: "image", scope: "meeting-only", assetId: "shared", title: "Photo" };
    state.assets = [
      { id: "shared", scope: "meeting-only", hash: "shared-hash" },
      { id: "private", scope: "meeting-only", hash: "private-hash" },
    ];
    state.meetings = [
      { id: "old", status: "completed", date: "2026-09-25", presenter: "Thomas", slides: [
        { id: "one", definition: { title: "Personal share" }, items: [item, { ...item, id: "private-item", assetId: "private" }] },
        { id: "two", definition: { title: "Safety Moment" }, items: [{ id: "safety", type: "lesson" }] },
      ] },
      { id: "new", status: "draft", date: "2026-09-29", slides: [
        { id: "another", definition: { title: "Personal share" }, items: [item] },
      ] },
    ];
    state.usage = [{ id: "usage", meetingId: "old", contentId: "safety" }];
    const result = expireSavedMedia(state, new Date(2026, 8, 27).getTime());
    expect(result.changed).toBe(true);
    expect(result.hashes).toEqual(["private-hash"]);
    expect(result.state.assets.map((asset) => asset.id)).toEqual(["shared"]);
    expect(result.state.meetings[0].slides[0].items.every((item:any)=>!item.assetId&&item.mediaDeleted)).toBe(true);
    expect(result.state.meetings[0].slides[1].items).toHaveLength(1);
    expect(result.state.meetings[1].slides[0].items).toHaveLength(1);
    expect(result.state.usage).toEqual(state.usage);
    expect(expireSavedMedia(result.state, new Date(2026, 8, 28).getTime()).changed).toBe(false);
  });
});
