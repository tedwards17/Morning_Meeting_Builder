import type * as RT from "react";
import { React as RecoveredReact } from "../recovered/index-DwifuW9D.js";
import { t as translateUI, getLanguage, subscribeLanguage, getLocale, uiText, uiError } from "./i18n";
import { readableTranscriptText, transcriptParagraphs, transcriptTopicTitle, transcriptDisplayEntries } from "./meeting-history";
import {cachedTranscript, loadTranscriptTranslations, prepareTranscriptTranslations, saveTranscriptTranslations, type TranscriptTranslationCache} from "./transcript-translations";
import { transcriptSearchParts } from "./transcript-search";
import type { Row } from "./types";
const React = RecoveredReact as typeof RT;

export function TranscriptReader({meeting}: {meeting: Row}) {
  const language = React.useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
  const [cache, setCache] = React.useState<TranscriptTranslationCache>({});
  const [preparing, setPreparing] = React.useState(false);
  const [translationError, setTranslationError] = React.useState("");
  const [retry, setRetry] = React.useState(0);
  const [detailed, setDetailed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [manualCopy, setManualCopy] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const reader = React.useRef<HTMLElement>(null);
  const displayed = cachedTranscript(meeting, cache);
  const paragraphs = transcriptParagraphs(displayed, language);
  const displayedEntries = transcriptDisplayEntries(displayed, language);
  const missing = displayedEntries.filter(row => row.missingTranslation).length;
  const hasTranslated = displayedEntries.some(row => row.translated && !row.missingTranslation);
  const speechIdentity = (meeting.transcript ?? []).map((row: Row) => row.id).join("|");
  React.useEffect(() => {
    let active = true; const controller = new AbortController();
    setTranslationError(""); setPreparing(true); setMessage(""); setManualCopy(false);
    void (async () => {
      const savedCache = await loadTranscriptTranslations(meeting);
      if (!active) return;
      setCache(savedCache);
      await prepareTranscriptTranslations(cachedTranscript(meeting, savedCache), language, retry > 0, controller.signal, async values => {
        const next = await saveTranscriptTranslations(meeting, values);
        if (active) setCache(next);
      });
    })().catch(error => {
      if (active && error?.name !== "AbortError") setTranslationError(uiError(error));
    }).finally(() => {if (active) setPreparing(false);});
    return () => {active = false; controller.abort();};
  }, [meeting.id, language, retry, speechIdentity]);
  const needle = query.trim().toLocaleLowerCase(getLocale());
  const topicTitle = (entry: Row | {slideId: string; slideTitle: string}) => transcriptTopicTitle(meeting, entry as {slideId: string; slideTitle: string});
  const matches = (text: string, title: string) =>
    !needle || `${title} ${text}`.toLocaleLowerCase(getLocale()).includes(needle);
  const entries: Row[] = displayedEntries.filter((row: Row) => matches(row.text, topicTitle(row)));
  const newTopic = (index: number) => !paragraphs[index - 1] ||
    paragraphs[index - 1].slideId !== paragraphs[index].slideId || paragraphs[index - 1].slideTitle !== paragraphs[index].slideTitle;
  const searchTexts = detailed ? entries.flatMap(row => [topicTitle(row), row.text])
    : paragraphs.flatMap((row, index) => newTopic(index) ? [topicTitle(row), row.text] : [row.text]);
  const matchCount = searchTexts.reduce((count, text) => count + transcriptSearchParts(text, query).filter(part => part.match).length, 0);
  const highlight = (text: string) => transcriptSearchParts(text, query).map((part, index) =>
    part.match ? <mark className="transcript-match" key={index}>{part.text}</mark> : part.text);
  const renderParagraph = (paragraph: typeof paragraphs[number]) => {
    let cursor = 0;
    const ranges = transcriptSearchParts(paragraph.text, query).flatMap(part => {
      const start = cursor; cursor += part.text.length;
      return part.match ? [{start, end: cursor}] : [];
    });
    let offset = 0;
    return paragraph.parts.map((part, index) => {
      const from = offset; offset += part.text.length + (index < paragraph.parts.length - 1 ? 1 : 0);
      const cuts = [...new Set([0, part.text.length, ...ranges.flatMap(range => [Math.max(0, Math.min(part.text.length, range.start - from)), Math.max(0, Math.min(part.text.length, range.end - from))])])].sort((a,b) => a-b);
      const text = cuts.slice(0,-1).map((start,i) => {
        const value = part.text.slice(start,cuts[i+1]);
        return ranges.some(range => range.start < from+cuts[i+1] && range.end > from+start)
          ? <mark className="transcript-match" key={i}>{value}</mark> : value;
      });
      return <React.Fragment key={index}>{index > 0 && " "}{part.missingTranslation
        ? <span className="muted">{translateUI("Translation pending")}</span>
        : part.translated ? <em>{text}<sup>*</sup></em> : text}</React.Fragment>;
    });
  };
  function dismissKeyboard() {
    input.current?.blur();
    if (document.activeElement instanceof HTMLElement && reader.current?.contains(document.activeElement)) document.activeElement.blur();
  }
  function search(event: RT.FormEvent) {
    event.preventDefault(); dismissKeyboard();
    reader.current?.querySelector(".transcript-match")?.scrollIntoView({block: "center"});
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(readableTranscriptText(displayed, language));
      setMessage(translateUI("Entire transcript copied.")); setManualCopy(false);
    } catch {
      setManualCopy(true); setMessage(translateUI("Select the text below to copy the entire transcript."));
    }
  }
  return <section ref={reader} className="panel meeting-transcript" aria-label={translateUI("Transcript")}>
    <div className="transcript-heading"><h2>{translateUI("Transcript")}</h2>
      {paragraphs.length > 0 && <div className="actions">
        <button disabled={missing > 0} onClick={copy}>{translateUI("Copy entire transcript")}</button>
        <button onClick={() => globalThis.MMB.exportTranscript(meeting, "readable")}>{translateUI("Download spoken transcript (.txt)")}</button>
      </div>}
    </div>
    {paragraphs.length > 0 ? <>
      <p className="muted">{translateUI(language === "en" ? "English transcript" : "Spanish transcript")}{hasTranslated && <> · {translateUI("* Translated from the original speech.")}</>}</p>
      {missing > 0 && <div className="transcript-translation-state" role="status">
        <p>{preparing ? translateUI("Preparing this transcript language…") : translationError ? uiText(translationError) : translateUI("Some passages still need translation.")}</p>
        {!preparing && <button onClick={() => setRetry(value => value+1)}>{translateUI("Prepare translated transcript")}</button>}
      </div>}
      <form className="transcript-tools" onSubmit={search}>
        <div className="transcript-search-field">
        <input ref={input} type="search" enterKeyHint="search" aria-label={translateUI("Search transcript")} placeholder={translateUI("Search transcript")}
          value={query} onChange={event => setQuery(event.target.value)} />
        <button className="transcript-search-button" type="submit" aria-label={translateUI("Search")} title={translateUI("Search")}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>
          </svg>
        </button>
        </div>
        <button type="button" aria-pressed={detailed} onClick={() => setDetailed(value => !value)}>
          {translateUI(detailed ? "Readable view" : "Detailed timestamps")}</button>
      </form>
      {needle && <p className="muted" role="status">{matchCount
        ? translateUI("{arg0} matches highlighted. Copy and download include the entire transcript.", {arg0: matchCount})
        : translateUI("No matching transcript text.")}</p>}
      {message && <p role="status">{uiText(message)}</p>}
      {manualCopy && <textarea className="transcript-copy" readOnly aria-label={translateUI("Entire transcript")}
        value={missing ? "" : readableTranscriptText(displayed, language)} onFocus={event => event.currentTarget.select()} />}
      {detailed ? <ol className="transcript-details">{entries.map(entry => <li key={entry.id}>
        <small><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString(getLocale())}</time>{topicTitle(entry) && <> · {highlight(topicTitle(entry))}</>} · {entry.language.toUpperCase()}</small>
        <p>{entry.missingTranslation ? <span className="muted">{translateUI("Translation pending")}</span>
          : entry.translated ? <em>{highlight(entry.text)}<sup>*</sup></em> : highlight(entry.text)}</p>
      </li>)}</ol> : <div className="transcript-paragraphs">{paragraphs.map((paragraph, index) => {
        return <div key={paragraph.id} className="transcript-paragraph">
          {newTopic(index) && topicTitle(paragraph) && <h3>{highlight(topicTitle(paragraph))}</h3>}
          <p><time className="transcript-time" dateTime={paragraph.at}>{new Date(paragraph.at).toLocaleTimeString(getLocale(), {hour:"numeric", minute:"2-digit"})}</time>{" "}{renderParagraph(paragraph)}</p>
        </div>;
      })}</div>}
    </> : <p>{translateUI("No transcript was captured. During presentation, choose Start transcript or Start Translation to save speech text.")}</p>}
  </section>;
}
