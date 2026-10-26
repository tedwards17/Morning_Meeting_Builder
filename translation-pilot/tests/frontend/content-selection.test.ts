import {describe,it,expect} from "vitest";
import {matchesSlideContent,contentCategory,playableContent,youtubeId,sharedWith} from "../../frontend/src/content-selection";
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

describe("simplified editor categories preserve legacy content",()=>{
 it("maps legacy text kinds and normal links without mutating stored records",()=>{
  for(const type of ["lesson","text","vocabulary","recognition","stretch"]){
   const item={id:"same-id",type,title:"User title",description:"Original body"};
   expect(contentCategory(item)).toBe("text");expect(playableContent(item)).toBe(item);
  }
  for(const type of ["image","image-text","video"])expect(contentCategory({type,assetId:"asset"})).toBe("media");
 });
 it("recognizes supported YouTube paths and never treats arbitrary websites as video",()=>{
  for(const url of ["https://youtu.be/dQw4w9WgXcQ?t=12","https://www.youtube.com/watch?v=dQw4w9WgXcQ","https://youtube.com/shorts/dQw4w9WgXcQ","https://www.youtube.com/embed/dQw4w9WgXcQ"])expect(youtubeId(url)).toBe("dQw4w9WgXcQ");
  for(const url of ["https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ","https://example.org/video","not a URL"])expect(youtubeId(url)).toBeNull();
  const link={id:"keep",type:"link",url:"https://youtu.be/dQw4w9WgXcQ",description:"Keep this"};expect(playableContent(link)).toMatchObject({...link,type:"external-video"});expect(link.type).toBe("link");
 });
 it("keeps scoped sharing separate from categories and preserves media slide eligibility",()=>{
  expect(sharedWith({locations:[]},"new-location")).toBe(true);expect(sharedWith({locations:["a"]},"b")).toBe(false);
  expect(matchesSlideContent({type:"gallery",libraryId:"library"},{type:"video",assetId:"media",libraryId:"library"})).toBe(true);
  expect(matchesSlideContent({type:"image",libraryId:"library"},{type:"video",assetId:"media",libraryId:"library"})).toBe(false);
 });
});
