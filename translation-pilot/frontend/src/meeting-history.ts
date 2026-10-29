import type { Row, Account } from "./types";
import type { Caption, TranscriptTranslation } from "./translation";
import { t as translateUI } from "./i18n";

export function canReadMeeting(account: Account, meeting: Row): boolean {
  return account.organization_id === meeting.organization_id &&
    (account.role === "administrator" || account.id === meeting.account_id);
}

export function groupMeetings(meetings: Row[]) {
  const saved = meetings.filter((meeting) => meeting.status === "draft" && !meeting.startedAt);
  const presented = meetings.filter((meeting) => !saved.includes(meeting));
  saved.sort((a,b) => a.date.localeCompare(b.date) || b.createdAt.localeCompare(a.createdAt));
  presented.sort((a,b) => String(b.endedAt ?? b.startedAt ?? b.date).localeCompare(String(a.endedAt ?? a.startedAt ?? a.date)));
  return {saved,presented};
}

export function withTranscript(meeting: Row, slide: Row, phrase: Caption, at = new Date().toISOString()): Row {
  const transcript = meeting.transcript ?? [];
  if (transcript.length >= 6000) throw new Error("Transcript limit reached. Stop capture and start a new meeting.");
  return { ...meeting, transcript: [...transcript, {
    id: phrase.id ?? crypto.randomUUID(), at, text: phrase.text, language: phrase.source,
    presenter: meeting.presenter, slideId: slide.id, slideTitle: slide.definition.title,
    contentTitles: slide.items.map((item: Row) => item.title),
  }] };
}

export function withTranscriptTranslations(meeting: Row, translations: TranscriptTranslation[]): Row {
  return {...meeting, transcript: (meeting.transcript ?? []).map((entry: Row) => {
    const added = translations.filter(item => item.id === entry.id && item.language !== entry.language && item.text.trim());
    if (!added.length) return entry;
    const values = {...entry.translations};
    for (const item of added) values[item.language] ??= item.text;
    return {...entry, translations: values};
  })};
}

export function transcriptDisplayEntries(meeting: Row, language?: "en" | "es"): Row[] {
  return (meeting.transcript ?? []).map((entry: Row) => {
    const translated = !!language && entry.language !== language;
    const text = translated ? entry.translations?.[language!] : entry.text;
    const available = typeof text === "string" && !!text.trim();
    return {...entry, text: available ? text : "", translated, missingTranslation: !available};
  });
}

export function withPresentedTopic(meeting: Row, slide: Row, ids: string[], at = new Date().toISOString()): Row {
  const topics: Row[] = meeting.presentedTopics ?? [];
  const prior = topics.find((topic) => topic.slideId === slide.id);
  const content = slide.items.filter((item: Row) => ids.includes(item.id))
    .map((item: Row) => ({ id: item.id, title: item.title, type: item.type }));
  const topic = { id: slide.id, slideId: slide.id, title: slide.definition.title,
    presenter: meeting.presenter, at: prior?.at ?? at,
    content: [...new Map([...(prior?.content ?? []), ...content].map((item) => [item.id, item])).values()] };
  return { ...meeting, presentedTopics: prior
    ? topics.map((entry) => entry.slideId === slide.id ? topic : entry) : [...topics, topic] };
}

export function transcriptText(meeting: Row): string {
  const title = `${meeting.templateName}\nPresenter: ${meeting.presenter}\nMeeting date: ${meeting.date}`;
  const topics = (meeting.presentedTopics ?? []).map((topic: Row) =>
    `${topic.title}: ${(topic.content ?? []).map((item: Row) => item.title).join("; ")}`).join("\n");
  const lines = (meeting.transcript ?? []).map((entry: Row) =>
    `[${entry.at}] ${entry.slideTitle} (${entry.language.toUpperCase()}): ${entry.text}`).join("\n");
  return `${title}\n\nPresented topics\n${topics || "No slides logged."}\n\nTranscript\n${lines || "No transcript captured."}\n`;
}

export type TranscriptParagraph = {
  id: string; at: string; slideId: string; slideTitle: string; text: string;
  parts: {text: string; translated: boolean; missingTranslation: boolean}[];
};

export function transcriptTopicTitle(meeting: Row, entry: {slideId: string; slideTitle: string}): string {
  const slide = (meeting.slides ?? []).find((row: Row) => row.id === entry.slideId);
  return slide?.definition?.type === "intro" || entry.slideTitle.trim().toLowerCase() === "good morning"
    ? "" : entry.slideTitle;
}

// Keep the original fragments intact. Receipt timestamps are not silence measurements:
// older recordings can be compacted without inventing pauses or speaker identities.
export function transcriptParagraphs(meeting: Row, language?: "en" | "es"): TranscriptParagraph[] {
  const paragraphs: TranscriptParagraph[] = [];
  let words = 0;
  for (const entry of transcriptDisplayEntries(meeting, language)) {
    const text = String(entry.text ?? "").trim();
    if (!text && !entry.missingTranslation) continue;
    const part = {text, translated: entry.translated, missingTranslation: entry.missingTranslation};
    const previous = paragraphs.at(-1);
    if (!previous || previous.slideId !== entry.slideId || previous.slideTitle !== entry.slideTitle || words >= 120) {
      paragraphs.push({id: entry.id, at: entry.at, slideId: entry.slideId,
        slideTitle: entry.slideTitle, text, parts: [part]});
      words = text.split(/\s+/).length;
    } else {
      previous.text += " " + text;
      const last = previous.parts.at(-1)!;
      if (!part.missingTranslation && !last.missingTranslation && last.translated === part.translated) last.text += " " + text;
      else previous.parts.push(part);
      words += text.split(/\s+/).length;
    }
  }
  return paragraphs;
}

export function readableTranscriptText(meeting: Row, language?: "en" | "es"): string {
  const paragraphs = transcriptParagraphs(meeting, language);
  if (paragraphs.some(row => row.parts.some(part => part.missingTranslation)))
    throw new Error(translateUI("Finish preparing this language before copying the transcript."));
  const parts = [`${meeting.templateName}\n${translateUI("Presenter")}: ${meeting.presenter || translateUI("Not entered")}\n${translateUI("Meeting date")}: ${meeting.date}`, translateUI("Transcript")];
  paragraphs.forEach((paragraph, index) => {
    const previous = paragraphs[index - 1];
    const topic = transcriptTopicTitle(meeting, paragraph);
    if (topic && (!previous || previous.slideId !== paragraph.slideId || previous.slideTitle !== paragraph.slideTitle))
      parts.push(topic);
    parts.push(language ? paragraph.parts.map(part => part.translated ? `${part.text}*` : part.text).join(" ") : paragraph.text);
  });
  if (!paragraphs.length) parts.push(translateUI("No transcript captured."));
  if (language && paragraphs.some(row => row.parts.some(part => part.translated))) parts.push(translateUI("* Translated from the original speech."));
  return parts.join("\n\n") + "\n";
}

export function unusedMeeting(meeting:Row,events:Row[]=[]):boolean {
 return meeting.status==='draft'&&!meeting.startedAt&&!meeting.endedAt&&!(meeting.presentedTopics??[]).length&&!(meeting.transcript??[]).length&&!events.some(event=>event.meeting_id===meeting.id);
}
