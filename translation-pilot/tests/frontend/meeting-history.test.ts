import { expect, test } from "vitest";
import { withTranscript, withPresentedTopic, transcriptText, canReadMeeting, groupMeetings } from "../../frontend/src/meeting-history";
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
