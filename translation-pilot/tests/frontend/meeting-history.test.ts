import { expect, test } from "vitest";
import { withTranscript, withTranscriptTranslations, withPresentedTopic, transcriptText, readableTranscriptText, transcriptParagraphs, transcriptDisplayEntries, transcriptTopicTitle, canReadMeeting, groupMeetings } from "../../frontend/src/meeting-history";
import { defaults } from "../../frontend/src/defaults";
import { expireSavedMedia } from "../../frontend/src/retention";
const slide = {id:crypto.randomUUID(),definition:{title:"Safety Moment"},items:[{id:crypto.randomUUID(),title:"Safe lifting",type:"lesson"}]};
const meeting = {id:crypto.randomUUID(),presenter:"Thomas",templateName:"Morning Meeting",date:"2026-09-25",status:"completed",slides:[slide]};
test("keeps each original-language phrase and its presented topic snapshot after media expires",()=>{
  let saved=withPresentedTopic(meeting,slide,[slide.items[0].id]);
  saved=withTranscript(saved,slide,{source:"en",text:"Keep the aisle clear."});
  saved=withTranscript(saved,slide,{source:"es",text:"El pasillo está libre."});
  const state=defaults();state.meetings=[saved];
  const expired=expireSavedMedia(state,new Date(2026,8,28).getTime()).state.meetings[0];
  expect(expired.transcript).toHaveLength(2);
  expect(expired.transcript[0]).toMatchObject({presenter:"Thomas",slideTitle:"Safety Moment",contentTitles:["Safe lifting"]});
  expect(transcriptText(expired)).toContain("El pasillo está libre.");
  expect(transcriptText(expired)).toContain("Safe lifting");
});
test("shows and copies the selected language while spoken downloads remain original and translations stay immutable",()=>{
  let saved=withTranscript(meeting,slide,{id:crypto.randomUUID(),source:"en",text:"Keep the aisle clear."});
  saved=withTranscript(saved,slide,{id:crypto.randomUUID(),source:"es",text:"Las herramientas están listas."});
  const originals=JSON.stringify(saved.transcript);
  expect(()=>readableTranscriptText(saved,"en")).toThrow("Finish preparing");
  saved=withTranscriptTranslations(saved,[{id:saved.transcript[0].id,language:"es",text:"Mantén el pasillo despejado."},
    {id:saved.transcript[1].id,language:"en",text:"The tools are ready."}]);
  expect(transcriptDisplayEntries(saved,"en").map(row=>row.text)).toEqual(["Keep the aisle clear.","The tools are ready."]);
  expect(transcriptDisplayEntries(saved,"es").map(row=>row.text)).toEqual(["Mantén el pasillo despejado.","Las herramientas están listas."]);
  expect(readableTranscriptText(saved,"en")).toContain("The tools are ready.*");
  expect(readableTranscriptText(saved,"en")).not.toContain("Las herramientas");
  expect(readableTranscriptText(saved)).toContain("Las herramientas están listas.");
  expect(readableTranscriptText(saved)).not.toContain("The tools are ready.");
  const attempts=withTranscriptTranslations(saved,[{id:saved.transcript[1].id,language:"en",text:"Replacement"}]);
  expect(attempts.transcript[1].translations.en).toBe("The tools are ready.");
  expect(JSON.stringify(saved.transcript.map(({translations:_translations,...entry}: any)=>entry))).toBe(originals);
});
test("returning to a slide does not duplicate its topic record",()=>{
  const first=withPresentedTopic(meeting,slide,[slide.items[0].id]);
  expect(withPresentedTopic(first,slide,[slide.items[0].id]).presentedTopics).toHaveLength(1);
});
test("only the owning account or organization administrator can read meeting history",()=>{
  const owner={id:'own',organization_id:'dtb',role:'location' as const,category:'location' as const,can_create_templates:true};
  const saved={...meeting,organization_id:'dtb',account_id:'own'};
  expect(canReadMeeting(owner,saved)).toBe(true);
  expect(canReadMeeting({...owner,id:'other'},saved)).toBe(false);
  expect(canReadMeeting({...owner,id:'other',role:'content_manager'},saved)).toBe(false);
  expect(canReadMeeting({...owner,id:'admin',role:'administrator'},saved)).toBe(true);
  expect(canReadMeeting({...owner,organization_id:'other',role:'administrator'},saved)).toBe(false);
});
test("unpresented meetings sort first and past presentations sort newest first",()=>{
  const rows=[{...meeting,id:'older',startedAt:'2026-09-01T12:00:00Z'},
    {...meeting,id:'future',status:'draft',date:'2026-10-15',createdAt:'2026-10-09T12:00:00Z'},
    {...meeting,id:'recent',startedAt:'2026-10-09T12:00:00Z'}];
  expect(groupMeetings(rows).saved.map(row=>row.id)).toEqual(['future']);
  expect(groupMeetings(rows).presented.map(row=>row.id)).toEqual(['recent','older']);
});
test("joins partial sentences and mixed languages without changing saved fragments or inventing speaker changes",()=>{
  let saved=withTranscript(meeting,slide,{source:"en",text:"Keep the"},"2026-10-12T12:00:00Z");
  saved=withTranscript(saved,slide,{source:"en",text:"aisle clear."},"2026-10-12T12:00:04Z");
  saved=withTranscript(saved,slide,{source:"es",text:"El pasillo está libre."},"2026-10-12T12:01:00Z");
  const original=JSON.stringify(saved);
  expect(transcriptParagraphs(saved)).toHaveLength(1);
  expect(transcriptParagraphs(saved)[0].text).toBe("Keep the aisle clear. El pasillo está libre.");
  expect(readableTranscriptText(saved)).toContain("Keep the aisle clear. El pasillo está libre.");
  expect(readableTranscriptText(saved)).not.toContain("2026-10-12T12:");
  expect(JSON.stringify(saved)).toBe(original);
});
test("separates slide transitions in chronological order including returning to the same topic",()=>{
  const other={...slide,id:crypto.randomUUID(),definition:{title:"Improvements"}};
  let saved=withTranscript(meeting,slide,{source:"en",text:"Safety first."});
  saved=withTranscript(saved,other,{source:"en",text:"Move the tools."});
  saved=withTranscript(saved,slide,{source:"en",text:"Wear safety glasses."});
  expect(transcriptParagraphs(saved).map(row=>row.slideTitle)).toEqual(["Safety Moment","Improvements","Safety Moment"]);
  expect(readableTranscriptText(saved).indexOf("Move the tools.")).toBeLessThan(readableTranscriptText(saved).indexOf("Wear safety glasses."));
});
test("keeps long topics readable without dropping text and preserves the detailed export",()=>{
  let saved: typeof meeting & {transcript?: any[]}=meeting;
  for(let i=0;i<130;i++) saved=withTranscript(saved,slide,{source:"en",text:`word${i}`});
  const paragraphs=transcriptParagraphs(saved);
  expect(paragraphs).toHaveLength(2);
  expect(paragraphs.map(row=>row.text).join(" ")).toBe(Array.from({length:130},(_,i)=>`word${i}`).join(" "));
  expect(transcriptText(saved)).toContain(`[${saved.transcript![0].at}] Safety Moment (EN): word0`);
});
test("handles meetings without captured speech",()=>{
  expect(transcriptParagraphs(meeting)).toEqual([]);
  expect(readableTranscriptText(meeting)).toContain("No transcript captured.");
});
test("hides the introduction label while keeping Good morning when it was actually spoken",()=>{
  const intro={...slide,definition:{title:"Good morning",type:"intro"}};
  const saved=withTranscript({...meeting,slides:[intro]},intro,{source:"en",text:"Good morning, team. Keep the aisle clear."});
  const original=JSON.stringify(saved);
  expect(transcriptTopicTitle(saved,saved.transcript[0])).toBe("");
  expect(readableTranscriptText(saved)).toContain("Good morning, team.");
  expect(readableTranscriptText(saved).match(/Good morning/g)).toHaveLength(1);
  expect(JSON.stringify(saved)).toBe(original);
  expect(transcriptTopicTitle(meeting,{slideId:slide.id,slideTitle:"Safety Moment"})).toBe("Safety Moment");
});
