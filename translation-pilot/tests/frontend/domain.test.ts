import { describe, it, expect } from "vitest";
import {
  canTemplate,
  selectBroadcasts,
  insertBroadcasts,
  locationUsage,
  normalizeNumber,
  eventKey,
  csv,
} from "../../frontend/src/domain";
import type { Account, Broadcast, Usage } from "../../frontend/src/types";
const a = {
  id: "a",
  organization_id: "dtb",
  role: "location",
  location_id: "assembly",
  can_create_templates: true,
} as Account;
const template = {
  id: "t",
  organization_id: "dtb",
  owner_id: "owner",
  company_visible: true,
  access: [],
};
const broadcast = {
  id: "b",
  version: 1,
  title: "Safety",
  status: "published",
  start: "2026-09-01",
  end: "2026-09-30",
  locations: [],
  importance: "required",
  recurrence: "once",
  priority: 2,
  sequence: 1,
  slot: "Safety",
  content: { id: "c", title: "Daily safety" },
} as Broadcast;
describe("company permissions", () => {
  it("company use does not imply edit", () => {
    expect(canTemplate(a, template, "use")).toBe(true);
    expect(canTemplate(a, template, "edit")).toBe(false);
  });
  it("organization boundary overrides ownership", () =>
    expect(
      canTemplate(
        { ...a, organization_id: "other" },
        { ...template, owner_id: "a" },
        "edit",
      ),
    ).toBe(false));
  it("selected account and location permissions are independent", () => {
    const t = {
      ...template,
      company_visible: false,
      access: [{ location_id: "assembly", can_edit: true, can_use: false }],
    };
    expect(canTemplate(a, t, "edit")).toBe(true);
    expect(canTemplate(a, t, "use")).toBe(false);
    expect(canTemplate({ ...a, location_id: "paint" }, t, "edit")).toBe(false);
  });
});
describe("broadcast schedule", () => {
  it("once completion belongs to location", () => {
    const e = [
      {
        id: "e",
        broadcast_id: "b",
        location_id: "assembly",
        event_type: "broadcast_presented",
      } as Usage,
    ];
    expect(
      selectBroadcasts([broadcast], "assembly", e, "2026-09-15"),
    ).toHaveLength(0);
    expect(
      selectBroadcasts([broadcast], "paint", e, "2026-09-15"),
    ).toHaveLength(1);
  });
  it("every meeting ignores previous completion", () =>
    expect(
      selectBroadcasts(
        [{ ...broadcast, recurrence: "every" }],
        "assembly",
        [
          {
            id: "e",
            broadcast_id: "b",
            location_id: "assembly",
            event_type: "broadcast_presented",
          } as Usage,
        ],
        "2026-09-15",
      ),
    ).toHaveLength(1));
  it("filters date windows, archives, targets and drafts", () => {
    expect(selectBroadcasts([broadcast], "a", [], "2026-10-01")).toHaveLength(
      0,
    );
    expect(
      selectBroadcasts(
        [
          { ...broadcast, locations: ["paint"] },
          { ...broadcast, archived: true },
          { ...broadcast, status: "draft" },
        ],
        "assembly",
        [],
        "2026-09-15",
      ),
    ).toHaveLength(0);
  });
  it("orders priority, start and sequence deterministically", () =>
    expect(
      selectBroadcasts(
        [
          { ...broadcast, id: "2", sequence: 2 },
          { ...broadcast, id: "1", sequence: 1 },
          { ...broadcast, id: "3", priority: 3 },
        ],
        "a",
        [],
        "2026-09-15",
      ).map((b) => b.id),
    ).toEqual(["3", "1", "2"]));
  it("inserts required at slots and warns for missing slots", () => {
    const meeting = {
      id: "m",
      slides: [
        { id: "intro", definition: { type: "intro", title: "Welcome" } },
        { id: "s", definition: { title: "Safety" } },
      ],
    };
    const m = insertBroadcasts(meeting, [
      broadcast,
      { ...broadcast, id: "x", slot: "Missing" },
    ]);
    expect(m.slides.map((s: any) => s.broadcast_id ?? s.id)).toEqual([
      "intro",
      "x",
      "s",
      "b",
    ]);
    expect(m.warnings).toHaveLength(1);
    expect(meeting.slides).toHaveLength(2);
  });
  it("available and suggested require selection", () => {
    const m = { id: "m", slides: [] };
    expect(
      insertBroadcasts(m, [{ ...broadcast, importance: "suggested" }]).slides,
    ).toHaveLength(0);
    expect(
      insertBroadcasts(m, [{ ...broadcast, importance: "available" }], ["b"])
        .slides,
    ).toHaveLength(1);
  });
});
describe("rotation, input and exports", () => {
  it("combines devices at one location and isolates another", () => {
    const events = ["device1", "device2"].map(
      (d, i) =>
        ({
          id: String(i),
          content_id: "c",
          location_id: "assembly",
          device_id: d,
          event_type: "content_presented",
          occurred_at_utc: `2026-09-${15 + i}`,
        }) as Usage,
    );
    expect(locationUsage([{ id: "c" }], events, "assembly")[0].useCount).toBe(
      2,
    );
    expect(locationUsage([{ id: "c" }], events, "paint")[0].useCount).toBe(0);
  });
  it("does not count previews or skipped content", () =>
    expect(
      locationUsage(
        [{ id: "c" }],
        [
          {
            id: "e",
            content_id: "c",
            location_id: "a",
            event_type: "slide_opened",
          } as Usage,
        ],
        "a",
      )[0].useCount,
    ).toBe(0));
  it("defaults blank numbers only when normalization is called", () => {
    expect(normalizeNumber("", 30)).toBe(30);
    expect(normalizeNumber("99999", 0)).toBe(3600);
    expect(normalizeNumber("-1", 0)).toBe(0);
  });
  it("idempotency keys stable across retries", () =>
    expect(eventKey("m", "s", "content_presented", "c")).toBe(
      eventKey("m", "s", "content_presented", "c"),
    ));
  it("neutralizes spreadsheet formulas", () =>
    expect(csv([{ id: "x", title: '=HYPERLINK("bad")' }])).toContain(
      "'=HYPERLINK",
    ));
});

it("required skip keeps a once-per-location item due", () => {
  const events = [
    {
      id: "p",
      meeting_id: "m",
      slide_id: "s",
      broadcast_id: "b",
      location_id: "assembly",
      event_type: "broadcast_presented",
    },
    {
      id: "s",
      meeting_id: "m",
      slide_id: "s",
      broadcast_id: "b",
      location_id: "assembly",
      event_type: "broadcast_skipped",
    },
  ] as Usage[];
  expect(
    selectBroadcasts([broadcast], "assembly", events, "2026-09-15"),
  ).toHaveLength(1);
});

import {zonedInput,zonedUtc} from '../../frontend/src/domain';
it('DTB wall-clock schedule converts using organization timezone',()=>{expect(zonedUtc('2026-09-16T07:00','America/Los_Angeles')).toBe('2026-09-16T14:00:00.000Z');expect(zonedInput('2026-09-16T14:00:00.000Z','America/Los_Angeles')).toBe('2026-09-16T07:00')});
it('rejects nonexistent daylight-saving clock times',()=>expect(()=>zonedUtc('2026-03-08T02:30','America/Los_Angeles')).toThrow());
