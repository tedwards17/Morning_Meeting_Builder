import type * as RT from "react";
import { React as RecoveredReact } from "../recovered/index-DwifuW9D.js";
import { t as translateUI, getLocale, uiText } from "./i18n";
import { readableTranscriptText, transcriptParagraphs, transcriptTopicTitle } from "./meeting-history";
import { transcriptSearchParts } from "./transcript-search";
import type { Row } from "./types";
const React = RecoveredReact as typeof RT;

export function TranscriptReader({meeting}: {meeting: Row}) {
  const [detailed, setDetailed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [manualCopy, setManualCopy] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const reader = React.useRef<HTMLElement>(null);
  const paragraphs = transcriptParagraphs(meeting);
  const needle = query.trim().toLocaleLowerCase(getLocale());
  const topicTitle = (entry: Row | {slideId: string; slideTitle: string}) => transcriptTopicTitle(meeting, entry as {slideId: string; slideTitle: string});
  const matches = (text: string, title: string) =>
    !needle || `${title} ${text}`.toLocaleLowerCase(getLocale()).includes(needle);
  const entries: Row[] = (meeting.transcript ?? []).filter((row: Row) => matches(row.text, topicTitle(row)));
  const newTopic = (index: number) => !paragraphs[index - 1] ||
    paragraphs[index - 1].slideId !== paragraphs[index].slideId || paragraphs[index - 1].slideTitle !== paragraphs[index].slideTitle;
  const searchTexts = detailed ? entries.flatMap(row => [topicTitle(row), row.text])
    : paragraphs.flatMap((row, index) => newTopic(index) ? [topicTitle(row), row.text] : [row.text]);
  const matchCount = searchTexts.reduce((count, text) => count + transcriptSearchParts(text, query).filter(part => part.match).length, 0);
  const highlight = (text: string) => transcriptSearchParts(text, query).map((part, index) =>
    part.match ? <mark className="transcript-match" key={index}>{part.text}</mark> : part.text);
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
      await navigator.clipboard.writeText(readableTranscriptText(meeting));
      setMessage(translateUI("Entire transcript copied.")); setManualCopy(false);
    } catch {
      setManualCopy(true); setMessage(translateUI("Select the text below to copy the entire transcript."));
    }
  }
  return <section ref={reader} className="panel meeting-transcript" aria-label={translateUI("Transcript")}>
    <div className="transcript-heading"><h2>{translateUI("Transcript")}</h2>
      {paragraphs.length > 0 && <div className="actions">
        <button onClick={copy}>{translateUI("Copy entire transcript")}</button>
        <button onClick={() => globalThis.MMB.exportTranscript(meeting, "readable")}>{translateUI("Download transcript (.txt)")}</button>
      </div>}
    </div>
    {paragraphs.length > 0 ? <>
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
        value={readableTranscriptText(meeting)} onFocus={event => event.currentTarget.select()} />}
      {detailed ? <ol className="transcript-details">{entries.map(entry => <li key={entry.id}>
        <small><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString(getLocale())}</time>{topicTitle(entry) && <> · {highlight(topicTitle(entry))}</>} · {entry.language.toUpperCase()}</small>
        <p>{highlight(entry.text)}</p>
      </li>)}</ol> : <div className="transcript-paragraphs">{paragraphs.map((paragraph, index) => {
        return <div key={paragraph.id} className="transcript-paragraph">
          {newTopic(index) && topicTitle(paragraph) && <h3>{highlight(topicTitle(paragraph))}</h3>}
          <p><time className="transcript-time" dateTime={paragraph.at}>{new Date(paragraph.at).toLocaleTimeString(getLocale(), {hour:"numeric", minute:"2-digit"})}</time>{" "}{highlight(paragraph.text)}</p>
        </div>;
      })}</div>}
    </> : <p>{translateUI("No transcript was captured. During presentation, choose Start transcript or Start Translation to save speech text.")}</p>}
  </section>;
}
