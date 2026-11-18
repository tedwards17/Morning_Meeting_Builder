import type {Row} from './types';
// Match the builder's local calendar date, including around UTC midnight.
export function homeDay(now=new Date()):string {
 return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function todaySavedMeeting(meetings:Row[],date:string,location?:string):Row|undefined {
 return meetings.filter(m=>m.date===date&&['draft','presenting'].includes(m.status)&&!m.mediaCleanupConfirmed&&!m.mediaExpiredAt&&(!location||m.location_id===location))
  .sort((a,b)=>String(b.updatedAt??b.createdAt??'').localeCompare(String(a.updatedAt??a.createdAt??''))||String(b.createdAt??'').localeCompare(String(a.createdAt??''))||b.id.localeCompare(a.id))[0];
}
export function recentHomeMeetings(meetings:Row[]):Row[] {
 const sorted=[...meetings].sort((a,b)=>Number(a.status==='completed')-Number(b.status==='completed')||String(b.createdAt??'').localeCompare(String(a.createdAt??'')));
 let completed=0;return sorted.filter(m=>m.status!=='completed'||++completed<=10);
}
