import { describe, expect, it } from "vitest";
import { defaults, resetDefaults, upgradeDefaults, APP_VERSION } from "../../frontend/src/defaults";

describe("Round 3 starter data and browser upgrade", () => {
  it("starts with five libraries and the approved 13-slide content template", () => {
    const state = defaults();
    expect(state.libraries.map((library) => library.name)).toEqual([
      "Stretches", "Safety", "Lean learning", "Improvements", "Quote of the day",
    ]);
    expect(state.items.length).toBeGreaterThan(1300);
    expect(state.templates[0].slides).toHaveLength(13);
    expect(state.templates[0].slides[1]).toMatchObject({ type: "gallery", title: "Personal share" });
    expect(state.templates[0].slides.map((slide) => slide.title)).toContain("Morning movement");
    expect(state.templates[0].slides.map((slide) => slide.title)).toContain("Lean learning comments");
    expect(state.templates[0].slides.filter((slide) => slide.title === "Safety Moment")).toHaveLength(1);
    expect(state.templates[0].slides.at(-2).title).toBe("Quote of the day");
    expect(state.templates[0].slides.at(-1).title).toBe("Let’s get to work");
    expect(state.templates[0].slides.find((slide) => slide.title === "Small changes. Better work."))
      .toMatchObject({ type: "gallery", layout: "full-media", count: 12 });
    expect(state.templates[0].slides.find((slide) => slide.title === "Small changes. Better work.")?.libraryId).toBeUndefined();
    expect(state.items.filter((item) => item.libraryId.endsWith("0008")).every((item) => !/^Quote of the day #?\d+/.test(item.title))).toBe(true);
    expect(state.items.filter((item) => item.libraryId.endsWith("0008")).every((item) => item.title === item.title.trim())).toBe(true);
    expect(state.settings.appVersion).toBe(APP_VERSION);
  });

  it("moves saved Round 2 vocabulary while preserving custom content and meetings", () => {
    const state = defaults();
    const oldVocabulary = "00000000-0000-4000-8000-000000000004";
    state.settings.round3DefaultsVersion = 2;
    state.libraries.push({ id: oldVocabulary, name: "Vocabulary", archived: false });
    state.items.push({ ...state.items[0], id: crypto.randomUUID(), libraryId: oldVocabulary, title: "Shop term" });
    state.meetings.push({ id: crypto.randomUUID(), presenter: "A" });
    const next = upgradeDefaults(state);
    expect(next.libraries.some((library) => library.id === oldVocabulary)).toBe(false);
    expect(next.items.find((item) => item.title === "Shop term")?.libraryId)
      .toBe("00000000-0000-4000-8000-000000000005");
    expect(next.meetings).toEqual(state.meetings);
  });

  it("upgrades shipped defaults without replacing an edited item or saved meeting", () => {
    const state = defaults();
    const original = state.items.find((item) => item.libraryId.endsWith("0008"))!;
    state.settings.round3DefaultsVersion = 3;
    state.items = [
      { ...original, title: "Quote of the day 001", updatedAt: "2026-09-17T18:47:04.253Z", useCount: 2 },
      { ...original, id: crypto.randomUUID(), title: "My quote", updatedAt: new Date().toISOString() },
    ];
    state.meetings.push({ id: crypto.randomUUID(), presenter: "Yesterday", slides: [] });
    const next = upgradeDefaults(state);
    expect(next.items[0].title).not.toMatch(/^Quote of the day/);
    expect(next.items[0].useCount).toBe(2);
    expect(next.items[1].title).toBe("My quote");
    expect(next.meetings).toEqual(state.meetings);
    expect(next.settings.round3DefaultsVersion).toBe(5);
  });

  it("updates an untouched default template but retains customized templates and saved presentations", () => {
    const state = defaults();
    state.settings.round3DefaultsVersion = 4;
    state.templates[0] = { ...state.templates[0], slides: [...state.templates[0].slides].reverse() };
    state.meetings.push({ id: crypto.randomUUID(), date: "2026-09-25", status: "completed", slides: [] });
    const migrated = upgradeDefaults(state);
    expect(migrated.templates[0].slides.at(-1).title).toBe("Let’s get to work");
    expect(migrated.meetings).toEqual(state.meetings);
    const customized = { ...state, templates: [{ ...state.templates[0], updatedAt: new Date().toISOString() }] };
    expect(upgradeDefaults(customized).templates[0].slides[0].title).toBe("Let’s get to work");
  });

  it("resets only shipped content and template while keeping custom work and history", () => {
    const state = defaults();
    const custom = crypto.randomUUID();
    state.libraries.push({ id: custom, name: "Team ideas", archived: false });
    state.items.push({ ...state.items[0], id: crypto.randomUUID(), libraryId: custom, title: "Our idea" });
    state.items.push({ ...state.items[0], id: crypto.randomUUID(), title: "Replace me" });
    state.templates.push({ ...structuredClone(state.templates[0]), id: crypto.randomUUID(), name: "Custom template" });
    state.meetings.push({ id: crypto.randomUUID(), presenter: "A" });
    state.usage.push({ id: crypto.randomUUID(), contentId: state.items[0].id });
    const next = resetDefaults(state);
    expect(next.libraries.some((library) => library.id === custom)).toBe(true);
    expect(next.items.some((item) => item.title === "Our idea")).toBe(true);
    expect(next.items.some((item) => item.title === "Replace me")).toBe(false);
    expect(next.templates.some((template) => template.name === "Custom template")).toBe(true);
    expect(next.meetings).toEqual(state.meetings);
    expect(next.usage).toEqual(state.usage);
  });
});
