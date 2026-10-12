import type { Row, Account } from "./types";
import type { Caption } from "./translation";

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
    id: crypto.randomUUID(), at, text: phrase.text, language: phrase.source,
    presenter: meeting.presenter, slideId: slide.id, slideTitle: slide.definition.title,
    contentTitles: slide.items.map((item: Row) => item.title),
  }] };
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
