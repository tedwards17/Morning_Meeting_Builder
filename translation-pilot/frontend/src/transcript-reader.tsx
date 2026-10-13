import type * as RT from "react";
import { React as RecoveredReact } from "../recovered/index-DwifuW9D.js";
import { t as translateUI, getLocale, uiText } from "./i18n";
import { readableTranscriptText, transcriptParagraphs } from "./meeting-history";
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
  const matches = (text: string, title: string) =>
    !needle || `${title} ${text}`.toLocaleLowerCase(getLocale()).includes(needle);
  const entries: Row[] = (meeting.transcript ?? []).filter((row: Row) => matches(row.text, row.slideTitle));
  const newTopic = (index: number) => !paragraphs[index - 1] ||
    paragraphs[index - 1].slideId !== paragraphs[index].slideId || paragraphs[index - 1].slideTitle !== paragraphs[index].slideTitle;
  const searchTexts = detailed ? entries.flatMap(row => [row.slideTitle, row.text])
    : paragraphs.flatMap((row, index) => newTopic(index) ? [row.slideTitle, row.text] : [row.text]);
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
        <input ref={input} type="search" enterKeyHint="search" aria-label={translateUI("Search transcript")} placeholder={translateUI("Search transcript")}
          value={query} onChange={event => setQuery(event.target.value)} />
        <button type="submit">{translateUI("Search")}</button>
        <button type="button" onClick={() => {setQuery(""); dismissKeyboard();}}>{translateUI("Clear")}</button>
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
        <small><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString(getLocale())}</time> · {highlight(entry.slideTitle)} · {entry.language.toUpperCase()}</small>
        <p>{highlight(entry.text)}</p>
      </li>)}</ol> : <div className="transcript-paragraphs">{paragraphs.map((paragraph, index) => {
        return <div key={paragraph.id} className="transcript-paragraph">
          {newTopic(index) && <h3>{highlight(paragraph.slideTitle)}</h3>}
          <p><time className="transcript-time" dateTime={paragraph.at}>{new Date(paragraph.at).toLocaleTimeString(getLocale(), {hour:"numeric", minute:"2-digit"})}</time>{" "}{highlight(paragraph.text)}</p>
        </div>;
      })}</div>}
    </> : <p>{translateUI("No transcript was captured. During presentation, choose Start transcript or Start Translation to save speech text.")}</p>}
  </section>;
}
