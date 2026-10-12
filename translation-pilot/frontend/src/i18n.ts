import spanish from "./locales/es-MX.json";

export const localeRegistry = {
  en: { name: "English", locale: "en-US", country: "US", messages: {} as Record<string, string> },
  es: { name: "Español", locale: "es-MX", country: "MX", messages: spanish as Record<string, string> },
};
export type Language = keyof typeof localeRegistry;
export const languages = (Object.keys(localeRegistry) as Language[]).map(code => ({code, ...localeRegistry[code]}));
const storageKey = "mmb-ui-language";
const catalogEntries = languages.flatMap(item => Object.entries(item.messages));
const catalog: Record<string, string> = Object.fromEntries(catalogEntries);
const listeners = new Set<() => void>();
let language: Language = "en";
try {
  const saved = globalThis.localStorage?.getItem(storageKey);
  if (saved && Object.hasOwn(localeRegistry, saved)) language = saved as Language;
} catch { /* Storage can be disabled. */ }

export const getLanguage = () => language;
export const getLocale = () => languages.find(item => item.code === language)!.locale;
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function applyDocumentLanguage() {
  if (typeof document === "undefined" || !document.documentElement) return;
  document.documentElement.lang = getLocale();
  document.title = t("Morning Meeting Builder");
}
export function setLanguage(next: Language) {
  if (!languages.some(item => item.code === next) || next === language) return;
  language = next;
  try { globalThis.localStorage?.setItem(storageKey, next); } catch { /* Selection still works for this session. */ }
  applyDocumentLanguage();
  for (const listener of listeners) listener();
}
export function t(key: string, values: Record<string, unknown> = {}): string {
  const text = localeRegistry[language].messages[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => name in values ? String(values[name] ?? "") : match);
}
const reverse = new Map(catalogEntries.map(([key, value]) => [value, key]));
function pattern(text: string): { regex: RegExp; names: string[] } {
  const names: string[] = [];
  const parts = text.split(/(\{\w+\})/g).map(part => {
    if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1, -1)); return "([\\s\\S]*?)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  return { regex: new RegExp("^" + parts.join("") + "$"), names };
}
const messages = catalogEntries.filter(([key]) => /\{\w+\}/.test(key) && key.replace(/\{\w+\}/g, "").trim().length > 5)
  .flatMap(([key, translated]) => [key, translated].map(text => ({ key, ...pattern(text) })));
// Only apply to application messages, labels and status values. Never to user content.
export function uiText(value: string): string {
  if (value in catalog) return t(value);
  const english = reverse.get(value);
  if (english) return t(english);
  for (const message of messages) {
    const match = message.regex.exec(value);
    if (match) return t(message.key, Object.fromEntries(message.names.map((name, index) => [name, match[index + 1]])));
  }
  return value;
}
export function uiError(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value);
  return uiText(message.replace(/^Error:\s*/, ""));
}
const labels: Record<string, string> = {
  intro: "Introduction", closing: "Closing", discussion: "Discussion", divider: "Divider",
  library: "Library", vocabulary: "Vocabulary", recognition: "Recognition", stretch: "Stretch",
  gallery: "Media", image: "Image", "image-text": "Image and text", video: "Local video",
  "external-video": "Online video", youtube: "YouTube", link: "Web link", text: "Text",
  broadcasts: "Announcements / broadcasts", templates: "Templates", libraries: "Libraries",
  items: "Content", reports: "Reports", requirements: "Requirements", skips: "Skipped slides",
  locations: "Locations", usage: "Usage", safety: "Safety", meetings: "Meetings", accounts: "Accounts",
  devices: "Devices", organization: "Organization", storage: "Storage", audit: "Audit", readiness: "Server readiness", administrator: "Administrator",
  content_manager: "Content manager", report_viewer: "Report viewer", location: "Location account",
  individual: "Individual account", available: "Available", suggested: "Suggested", required: "Required",
  draft: "Draft", published: "Published", presenting: "Paused / in progress", completed: "Completed",
  next: "Next", previous: "Previous", foreground: "Text color", background: "Background", accent: "Accent color",
};
export function uiLabel(value: string): string { return t(labels[value] ?? value); }
applyDocumentLanguage();

// Browser validation bubbles otherwise follow the browser's own language.
if (typeof document !== "undefined") {
  document.addEventListener("invalid", event => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
    const v = field.validity;
    field.setCustomValidity(t(v.valueMissing ? "Please fill out this field." : v.typeMismatch ? "Please enter a valid value." : v.tooShort ? "This value is too short." : v.rangeUnderflow || v.rangeOverflow ? "Please enter a value within the allowed range." : "Please check this field."));
  }, true);
  document.addEventListener("input", event => {
    const field = event.target;
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.setCustomValidity("");
  }, true);
}
