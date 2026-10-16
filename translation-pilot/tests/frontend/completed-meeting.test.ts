import {expect,it} from "vitest";
import {mergeCompletedMeeting} from "../../frontend/src/completed-meeting";
it("preserves completed details while merging only new speech and missing translations",()=>{
 const saved={id:"m",status:"completed",presenter:"Thomas",slides:[{id:"s",items:[{title:"Photo"}]}],transcript:[{id:"a",text:"Original",language:"en",translations:{es:"Original guardado"}}]};
 const pending={...saved,presenter:"Stale presenter",mediaExpiredAt:"wrong",transcript:[{id:"a",text:"Edited",language:"es",translations:{es:"Replacement"}},{id:"b",text:"Late phrase",language:"en"}]};
 const result=mergeCompletedMeeting(saved,pending);
 expect(result.presenter).toBe("Thomas");expect(result.mediaExpiredAt).toBeUndefined();expect(result.slides).toEqual(saved.slides);
 expect(result.transcript).toEqual([...saved.transcript,pending.transcript[1]]);expect(saved.transcript).toHaveLength(1);
});
it("adds a late translation without changing the frozen speech context",()=>{
 const saved={id:"m",status:"completed",transcript:[{id:"a",text:"Good morning",language:"en",slideTitle:"Safety"}]};
 const result=mergeCompletedMeeting(saved,{...saved,transcript:[{...saved.transcript[0],slideTitle:"Changed",translations:{es:"Buenos días"}}]});
 expect(result.transcript[0]).toEqual({...saved.transcript[0],translations:{es:"Buenos días"}});
});
it("does not queue a transcript field merely by reading an older completed meeting",()=>{
 const saved={id:"m",status:"completed",presenter:"Thomas"};expect(mergeCompletedMeeting(saved,{...saved,mediaCleanupConfirmed:true})).toEqual(saved);
});
