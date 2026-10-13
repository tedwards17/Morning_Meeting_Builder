import {db} from "./db";
import {promptUI} from "./dialogs";
import {t as translateUI} from "./i18n";
import {translationApi, type TranscriptTranslation} from "./translation";
import {withTranscriptTranslations} from "./meeting-history";
import type {Row} from "./types";

export type CachedTranslation = TranscriptTranslation & {original: string; source: "en" | "es"};
export type TranscriptTranslationCache = Record<string, Partial<Record<"en" | "es", CachedTranslation>>>;
type Cache = TranscriptTranslationCache;
const cacheKey = (meeting: Row) => `transcript-translations:${meeting.organization_id ?? "local"}:${meeting.account_id ?? "local"}:${meeting.id}`;

export async function loadTranscriptTranslations(meeting: Row): Promise<Cache> {
  return (await db).get("meta", cacheKey(meeting)).then(value => value ?? {});
}
export function cachedTranscript(meeting: Row, cache: Cache): Row {
  const translations: TranscriptTranslation[] = [];
  for (const entry of meeting.transcript ?? []) {
    for (const item of Object.values(cache[entry.id] ?? {}))
      if (item && item.original === entry.text && item.source === entry.language) translations.push(item);
  }
  return withTranscriptTranslations(meeting, translations);
}
export async function saveTranscriptTranslations(meeting: Row, values: CachedTranslation[]): Promise<Cache> {
  const tx = (await db).transaction("meta", "readwrite");
  const key = cacheKey(meeting); const cache: Cache = await tx.store.get(key) ?? {};
  for (const item of values) {
    cache[item.id] ??= {};
    const prior = cache[item.id][item.language];
    if (!prior || prior.original !== item.original || prior.source !== item.source) cache[item.id][item.language] = item;
  }
  await tx.store.put(cache, key); await tx.done;
  // Read-only/admin reviews on another device cache derived text without modifying its meeting.
  if (globalThis.MMB.canSaveTranscriptTranslations(meeting))
    await globalThis.MMB.captureTranscriptTranslations(meeting.id, values);
  return cache;
}
export async function prepareTranscriptTranslations(meeting: Row, language: "en" | "es", allowPrompt: boolean,
  signal: AbortSignal, saved: (values: CachedTranslation[]) => Promise<void>): Promise<void> {
  const entries: Row[] = (meeting.transcript ?? []).filter((row: Row) => row.language !== language && !row.translations?.[language]);
  if (!entries.length) return;
  if (!navigator.onLine) throw new Error(translateUI("Connect to the internet to prepare this transcript language."));
  let auth = await translationApi("status", {}, "", signal);
  if (!auth.authenticated) {
    if (!allowPrompt) throw new Error(translateUI("Unlock translation to prepare this transcript language."));
    const passphrase = await promptUI(translateUI("Enter the presenter passphrase to prepare translated transcripts."), "", true);
    if (!passphrase || signal.aborted) throw new DOMException("Canceled", "AbortError");
    auth = await translationApi("unlock", {passphrase}, "", signal);
  }
  const source = language === "en" ? "es" : "en";
  while (entries.length && !signal.aborted) {
    const batch: Row[] = []; let bytes = 0;
    while (entries.length && batch.length < 20) {
      const size = new TextEncoder().encode(entries[0].text).length;
      if (batch.length && bytes + size > 20000) break;
      batch.push(entries.shift()!); bytes += size;
    }
    const result = await translationApi("transcript", {source, items: batch.map(row => ({id: row.id, text: row.text}))}, auth.csrf, signal);
    if (!Array.isArray(result.translations) || result.translations.length !== batch.length)
      throw new Error(translateUI("The translated transcript response was incomplete. Try again."));
    const values: CachedTranslation[] = batch.map((entry, index) => {
      const item = result.translations[index];
      if (item.id !== entry.id || item.language !== language || typeof item.text !== "string" || !item.text.trim())
        throw new Error(translateUI("The translated transcript response was incomplete. Try again."));
      return {...item, original: entry.text, source: entry.language};
    });
    await saved(values);
  }
}
