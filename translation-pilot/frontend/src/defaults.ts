import starterMeta from "./round2-seed-meta.json";
import items1 from "./round2-seed-items-1.json";
import items2 from "./round2-seed-items-2.json";
import items3 from "./round2-seed-items-3.json";
import items4 from "./round2-seed-items-4.json";
import deduplicatedVideos from "./round3-dedup-map.json";
import type { State } from "./types";

const starter = { ...starterMeta, items: [...items1, ...items2, ...items3, ...items4] };

export const APP_VERSION = "0.4.0";
const DEFAULTS_VERSION = 5;
const SHIPPED_AT = "2026-09-17T18:47:04.253Z";
export const DEFAULT_TEMPLATE_ID = starter.template.id;
export const DEFAULT_LIBRARY_IDS = new Set(starter.libraries.map((row) => row.id));
const OLD_PERSONAL = "00000000-0000-4000-8000-000000000001";
const OLD_VOCABULARY = "00000000-0000-4000-8000-000000000004";
const OLD_RECOGNITION = "00000000-0000-4000-8000-000000000007";
const LEAN = "00000000-0000-4000-8000-000000000005";
const IMPROVEMENTS = "00000000-0000-4000-8000-000000000006";
export const RETIRED_LIBRARY_IDS = new Set([OLD_PERSONAL, OLD_VOCABULARY, OLD_RECOGNITION]);

export function defaults(): State {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    device: { id: crypto.randomUUID(), name: "Main meeting area", createdAt: now },
    settings: {
      id: "settings", company: "Douglass Truck Bodies", defaultTemplateId: DEFAULT_TEMPLATE_ID,
      dateFormat: "long", hideControls: true, wakeLock: true,
      appVersion: APP_VERSION, round3DefaultsVersion: DEFAULTS_VERSION,
    },
    templates: [structuredClone(starter.template)],
    libraries: structuredClone(starter.libraries),
    items: structuredClone(starter.items),
    assets: [], meetings: [], usage: [],
    broadcasts: [],
  };
}

// Upgrade saved Round 2 data without changing personal content, history, or other templates.
export function upgradeDefaults(state: State): State {
  if (state.settings.round3DefaultsVersion === DEFAULTS_VERSION)
    return { ...state, settings: { ...state.settings, appVersion: APP_VERSION } };
  if (state.settings.round3DefaultsVersion === 4) {
    return { ...state,
      templates: state.templates.map((template) => template.id === DEFAULT_TEMPLATE_ID &&
        template.updatedAt === SHIPPED_AT ? structuredClone(starter.template) : template),
      settings: { ...state.settings, appVersion: APP_VERSION, round3DefaultsVersion: DEFAULTS_VERSION },
    };
  }
  if (state.settings.round3DefaultsVersion === 3) {
    const shipped = new Map(starter.items.map((item) => [item.id, item]));
    const duplicates: Record<string, string> = deduplicatedVideos;
    const items = state.items.flatMap((item) => {
      if (item.updatedAt !== SHIPPED_AT) return [item];
      if (duplicates[item.id]) return [];
      const replacement = shipped.get(item.id);
      return replacement ? [{ ...replacement, lastUsedAt: item.lastUsedAt, useCount: item.useCount }] : [item];
    });
    const templates = state.templates.map((template) => template.id === DEFAULT_TEMPLATE_ID &&
      template.updatedAt === SHIPPED_AT ? structuredClone(starter.template) : template);
    return upgradeDefaults({ ...state, items, templates,
      settings: { ...state.settings, appVersion: APP_VERSION, round3DefaultsVersion: 4 } });
  }
  const items = state.items.flatMap((item) => {
    if (!RETIRED_LIBRARY_IDS.has(item.libraryId)) return [item];
    if ((item.libraryId === OLD_PERSONAL || item.libraryId === OLD_RECOGNITION) &&
        item.tags?.includes("sample")) return [];
    return [{ ...item, libraryId: item.libraryId === OLD_VOCABULARY ? LEAN : IMPROVEMENTS }];
  });
  const retainedContent = new Set(items.map((item) => item.id));
  const templates = state.templates.map((template) => ({
    ...template,
    slides: template.slides.map((slide: any) => {
      if (slide.libraryId === OLD_PERSONAL)
        return { ...slide, type: "gallery", layout: "full-media", count: 12, text: "", libraryId: undefined, contentIds: [] };
      if (slide.libraryId === OLD_VOCABULARY) return { ...slide, libraryId: LEAN };
      if (slide.libraryId === OLD_RECOGNITION)
        return { ...slide, type: "discussion", text: slide.text || "Who helped someone else today? What did they do?", libraryId: undefined, contentIds: [] };
      return { ...slide, contentIds: slide.contentIds.filter((id: string) => retainedContent.has(id)) };
    }),
  }));
  return upgradeDefaults({
    ...state,
    settings: { ...state.settings, appVersion: APP_VERSION, round3DefaultsVersion: 3 },
    libraries: state.libraries.filter((row) => !RETIRED_LIBRARY_IDS.has(row.id)),
    items,
    templates,
  });
}

// Restore the shipped default libraries/content and default template; retain custom
// libraries, custom templates, meetings, history, media, and device preferences.
export function resetDefaults(current: State): State {
  const clean = defaults();
  const defaultIds = new Set([...DEFAULT_LIBRARY_IDS, ...RETIRED_LIBRARY_IDS]);
  const items = [...clean.items, ...current.items.filter((row) => !defaultIds.has(row.libraryId))];
  const retainedContent = new Set(items.map((row) => row.id));
  return {
    ...current,
    settings: { ...current.settings, appVersion: APP_VERSION, round3DefaultsVersion: DEFAULTS_VERSION },
    libraries: [...clean.libraries, ...current.libraries.filter((row) => !defaultIds.has(row.id))],
    items,
    templates: [clean.templates[0], ...current.templates.filter((row) => row.id !== DEFAULT_TEMPLATE_ID).map((template) => ({
      ...template,
      slides: template.slides.map((slide: any) => ({
        ...slide,
        contentIds: slide.contentIds.filter((id: string) => retainedContent.has(id)),
      })),
    }))],
  };
}
