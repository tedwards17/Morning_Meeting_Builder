import {expect,test} from 'vitest';
import {homeDay,recentHomeMeetings,todaySavedMeeting} from '../../frontend/src/home-guide-policy';
import type {Row} from '../../frontend/src/types';
const meeting=(id:string,fields:Partial<Row>={}):Row=>({id,date:'2026-11-18',status:'draft',createdAt:'2026-11-18T10:00:00Z',location_id:'assembly',...fields});
test('Home follows the builder local calendar instead of slicing a UTC date',()=>{
 expect(homeDay(new Date(2026,10,18,23,59))).toBe('2026-11-18');expect(homeDay(new Date(2026,10,19,0,1))).toBe('2026-11-19');
});
test('today tile ignores yesterday and future meetings even if more recently saved',()=>{
 const today=meeting('today');expect(todaySavedMeeting([meeting('old',{date:'2026-11-17',updatedAt:'2026-11-20'}),meeting('future',{date:'2026-11-19',updatedAt:'2026-11-20'}),today],'2026-11-18')).toBe(today);
});
test('today tile chooses the latest saved snapshot without mutating the source order',()=>{
 const a=meeting('newer-created',{createdAt:'2026-11-18T11:00:00Z'}),b=meeting('latest-save',{updatedAt:'2026-11-18T12:00:00Z'}),rows=[a,b];expect(todaySavedMeeting(rows,'2026-11-18')).toBe(b);expect(rows).toEqual([a,b]);
});
test('a paused meeting remains available but confirmed finishes and deleted media do not',()=>{
 const paused=meeting('paused',{status:'presenting'});expect(todaySavedMeeting([meeting('finished',{status:'completed',updatedAt:'2026-11-18T12:00:00Z'}),meeting('cleaned',{mediaCleanupConfirmed:true}),meeting('expired',{mediaExpiredAt:'2026-11-18'}),paused],'2026-11-18')).toBe(paused);
});
test('selected location cannot be replaced by a newer meeting from another area',()=>{
 expect(todaySavedMeeting([meeting('assembly'),meeting('paint',{location_id:'paint',updatedAt:'2026-11-18T12:00:00Z'})],'2026-11-18','assembly')?.id).toBe('assembly');expect(todaySavedMeeting([meeting('paint',{location_id:'paint'})],'2026-11-18','assembly')).toBeUndefined();
});
test('no ready meeting leaves the tile empty rather than reusing yesterday or a completion',()=>{
 expect(todaySavedMeeting([meeting('yesterday',{date:'2026-11-17'}),meeting('done',{status:'completed'})],'2026-11-18')).toBeUndefined();
});
test('saved list preserves all unfinished records and ten completed records',()=>{
 const rows=[meeting('draft'),meeting('paused',{status:'presenting'}),...Array.from({length:12},(_,i)=>meeting('done'+i,{status:'completed',createdAt:`2026-11-${String(i+1).padStart(2,'0')}T10:00:00Z`}))];const result=recentHomeMeetings(rows);expect(result).toHaveLength(12);expect(result.slice(0,2).map(m=>m.id)).toContain('draft');expect(result.filter(m=>m.status==='completed')).toHaveLength(10);expect(rows).toHaveLength(14);
});
