import type { Account, Broadcast, Row, Usage } from "./types";
export function canTemplate(
  account: Account,
  template: Row,
  action: "use" | "edit" | "share",
) {
  if (account.organization_id !== template.organization_id) return false;
  if (account.role === "administrator" || template.owner_id === account.id)
    return true;
  if (action === "share") return false;
  if (action === "use" && template.company_visible) return true;
  return (template.access ?? []).some(
    (a: Row) =>
      (a.account_id === account.id ||
        (!!account.location_id && a.location_id === account.location_id)) &&
      a[action === "use" ? "can_use" : "can_edit"],
  );
}
export function selectBroadcasts(
  broadcasts: Broadcast[],
  location: string,
  events: Usage[],
  at: string,
) {
  return broadcasts
    .filter(
      (b) =>
        b.status === "published" &&
        !b.archived &&
        b.start <= at &&
        b.end >= at &&
        (!b.locations.length || b.locations.includes(location)) &&
        !(
          b.recurrence === "once" &&
          events.some(
            (e) =>
              e.location_id === location &&
              e.broadcast_id === b.id &&
              e.event_type === "broadcast_presented" &&
              !events.some(
                (skip) =>
                  skip.event_type === "broadcast_skipped" &&
                  skip.meeting_id === e.meeting_id &&
                  skip.slide_id === e.slide_id &&
                  skip.broadcast_id === b.id,
              ),
          )
        ),
    )
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.start.localeCompare(b.start) ||
        a.sequence - b.sequence ||
        a.id.localeCompare(b.id),
    );
}
export function insertBroadcasts(
  meeting: Row,
  broadcasts: Broadcast[],
  selected: string[] = [],
) {
  const result = structuredClone(meeting);
  result.warnings = [];
  result.broadcast_choices = broadcasts.filter(
    (b) => b.importance !== "required",
  );
  const insertions = new Map<number, Row[]>();
  for (const b of broadcasts.filter(
    (b) => b.importance === "required" || selected.includes(b.id),
  )) {
    let idx = result.slides.findIndex(
      (s: Row) =>
        (s.definition.slot || s.definition.title).toLowerCase() ===
        b.slot.toLowerCase(),
    );
    if (idx < 0) {
      idx = result.slides.findIndex((s: Row) => s.definition.type === "intro");
      result.warnings.push(
        `“${b.title}”: slot “${b.slot}” missing; inserted after Introduction (or first when no Introduction exists).`,
      );
    }
    const slide = {
      id: crypto.randomUUID(),
      broadcast_id: b.id,
      broadcast_version: b.version,
      required: b.importance === "required",
      definition: {
        id: crypto.randomUUID(),
        title: b.title,
        type: b.content.assetId ? "image-text" : "text",
        layout: "center",
        text: "",
        notes: "",
        optional: false,
        duration: 0,
        contentIds: [],
        selection: "manual",
        count: 1,
        allowRepeat: true,
      },
      items: [structuredClone(b.content)],
      skipped: false,
    };
    insertions.set(idx, [...(insertions.get(idx) ?? []), slide]);
  }
  result.slides = [
    ...(insertions.get(-1) ?? []),
    ...result.slides.flatMap((s: Row, i: number) => [
      s,
      ...(insertions.get(i) ?? []),
    ]),
  ];
  return result;
}
export function locationUsage(items: Row[], events: Usage[], location: string) {
  return items.map((item) => {
    const uses = events.filter(
      (e) =>
        e.location_id === location &&
        e.content_id === item.id &&
        e.event_type === "content_presented",
    );
    return {
      ...item,
      useCount: uses.length,
      lastUsedAt:
        uses
          .map((e) => e.occurred_at_utc)
          .sort()
          .at(-1) ?? null,
    };
  });
}
export function normalizeNumber(
  value: string,
  fallback: number,
  min = 0,
  max = 3600,
) {
  const n = value.trim() === "" ? fallback : Number(value);
  return Number.isFinite(n)
    ? Math.min(max, Math.max(min, Math.trunc(n)))
    : fallback;
}
export function eventKey(
  meeting: string,
  slide: string,
  kind: string,
  content = "",
) {
  return [meeting, slide, kind, content].join(":");
}
export function csv(rows: Row[]) {
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const cell = (v: unknown) =>
    '"' +
    String(typeof v === "object" ? JSON.stringify(v) : (v ?? ""))
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return [keys, ...rows.map((r) => keys.map((k) => r[k]))]
    .map((r) => r.map(cell).join(","))
    .join("\r\n");
}
export function zonedInput(iso: string, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(parts.map((v) => [v.type, v.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function zonedUtc(input: string, zone: string) {
  const requested = Date.parse(input + "Z");
  if (!Number.isFinite(requested)) throw new Error("Invalid schedule time");
  let candidate = requested;
  for (let i = 0; i < 4; i++) {
    const rendered = Date.parse(
      zonedInput(new Date(candidate).toISOString(), zone) + "Z",
    );
    candidate += requested - rendered;
  }
  const iso = new Date(candidate).toISOString();
  if (zonedInput(iso, zone) !== input)
    throw new Error(
      "This local time does not exist because of daylight saving time. Choose another time.",
    );
  return iso;
}
