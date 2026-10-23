import {describe,it,expect} from "vitest";
import {matchesSlideContent} from "../../frontend/src/content-selection";
import {slidePolicy,normalizeUnstartedMeeting} from "../../frontend/src/slide-policy";

describe("Stretches library selection",()=>{
 it("accepts text, images and YouTube from the connected movement library",()=>{
  for(const type of ["lesson","stretch","image","image-text","external-video","link"])
   expect(matchesSlideContent({type:"stretch",libraryId:"movement"},{type,libraryId:"movement",archived:false})).toBe(true);
 });
 it("excludes archived and other-library content without changing Safety selection",()=>{
  expect(matchesSlideContent({type:"stretch",libraryId:"movement"},{type:"stretch",libraryId:"safety"})).toBe(false);
  expect(matchesSlideContent({type:"stretch",libraryId:"movement"},{type:"lesson",libraryId:"movement",archived:true})).toBe(false);
  expect(matchesSlideContent({type:"library",libraryId:"safety"},{type:"external-video",libraryId:"safety"})).toBe(true);
 });
 it("leaves completed and presenting history unchanged even without a started timestamp",()=>{
  for(const status of ["completed","presenting"]) {
   const meeting={status,slides:[{definition:{id:"00000000-0000-4000-8000-000000001002",type:"stretch"},items:[]}]};
   expect(normalizeUnstartedMeeting(meeting)).toBe(meeting);
  }
 });
 it("repairs a disconnected standard movement slide and leaves custom timer-only slides alone",()=>{
  const standard={id:"00000000-0000-4000-8000-000000001002",type:"stretch"};
  expect(slidePolicy(standard).libraryId).toBe("00000000-0000-4000-8000-000000000002");
  expect(slidePolicy({id:"custom",type:"stretch"}).libraryId).toBeUndefined();
  const started={startedAt:"2026-10-23",slides:[{definition:standard,items:[]}]};
  expect(normalizeUnstartedMeeting(started)).toBe(started);
 });
});
