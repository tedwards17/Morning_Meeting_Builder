import type * as RT from "react";
import { React as RecoveredReact } from "../recovered/index-DwifuW9D.js";
import { t as translateUI, getLocale, uiText } from "./i18n";
import { readableTranscriptText, transcriptParagraphs } from "./meeting-history";
import type { Row } from "./types";
const React = RecoveredReact as typeof RT;

export function TranscriptReader({meeting}: {meeting: Row}) {
  const [detailed, setDetailed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [manualCopy, setManualCopy] = React.useState(false);
  const paragraphs = transcriptParagraphs(meeting);
  const needle = query.trim().toLocaleLowerCase(getLocale());
  const matches = (text: string, title: string) =>
    !needle || `${title} ${text}`.toLocaleLowerCase(getLocale()).includes(needle);
  const visible = paragraphs.filter(row => matches(row.text, row.slideTitle));
  const entries: Row[] = (meeting.transcript ?? []).filter((row: Row) => matches(row.text, row.slideTitle));
  async function copy() {
    try {
      await navigator.clipboard.writeText(readableTranscriptText(meeting));
      setMessage(translateUI("Entire transcript copied.")); setManualCopy(false);
    } catch {
      setManualCopy(true); setMessage(translateUI("Select the text below to copy the entire transcript."));
    }
  }
  return <section className="panel meeting-transcript" aria-label={translateUI("Transcript")}>
    <div className="transcript-heading"><h2>{translateUI("Transcript")}</h2>
      {paragraphs.length > 0 && <div className="actions">
        <button onClick={copy}>{translateUI("Copy entire transcript")}</button>
        <button onClick={() => globalThis.MMB.exportTranscript(meeting, "readable")}>{translateUI("Download transcript (.txt)")}</button>
      </div>}
    </div>
    {paragraphs.length > 0 ? <>
      <div className="transcript-tools">
        <input type="search" aria-label={translateUI("Search transcript")} placeholder={translateUI("Search transcript")}
          value={query} onChange={event => setQuery(event.target.value)} />
        <button aria-pressed={detailed} onClick={() => setDetailed(value => !value)}>
          {translateUI(detailed ? "Readable view" : "Detailed timestamps")}</button>
      </div>
      {query && <p className="muted" role="status">{translateUI("Showing matching text. Copy and download include the entire transcript.")}</p>}
      {message && <p role="status">{uiText(message)}</p>}
      {manualCopy && <textarea className="transcript-copy" readOnly aria-label={translateUI("Entire transcript")}
        value={readableTranscriptText(meeting)} onFocus={event => event.currentTarget.select()} />}
      {detailed ? <ol className="transcript-details">{entries.map(entry => <li key={entry.id}>
        <small><time dateTime={entry.at}>{new Date(entry.at).toLocaleTimeString(getLocale())}</time> · {entry.slideTitle} · {entry.language.toUpperCase()}</small>
        <p>{entry.text}</p>
      </li>)}</ol> : <div className="transcript-paragraphs">{visible.map((paragraph, index) => {
        const previous = visible[index - 1];
        const newTopic = !previous || previous.slideId !== paragraph.slideId || previous.slideTitle !== paragraph.slideTitle;
        return <div key={paragraph.id} className="transcript-paragraph">
          {newTopic && <h3>{paragraph.slideTitle}</h3>}
          <p><time className="transcript-time" dateTime={paragraph.at}>{new Date(paragraph.at).toLocaleTimeString(getLocale(), {hour:"numeric", minute:"2-digit"})}</time>{" "}{paragraph.text}</p>
        </div>;
      })}</div>}
      {(detailed ? entries.length : visible.length) === 0 && <p>{translateUI("No matching transcript text.")}</p>}
    </> : <p>{translateUI("No transcript was captured. During presentation, choose Start transcript or Start Translation to save speech text.")}</p>}
  </section>;
}
