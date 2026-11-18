import type * as RT from 'react';
import {React as RecoveredReact,useApp,Slide as RecoveredSlide} from '../recovered/index-DwifuW9D.js';
import {t} from './i18n';
import * as runtime from './runtime';
import {canReadMeeting} from './meeting-history';
import {homeDay,recentHomeMeetings,todaySavedMeeting} from './home-guide-policy';
import {formatMeetingDate} from './meeting-date';
import {meetingSlideRows} from './meeting-slides';
import {isMeetingExpired} from './retention';
import type {Row,State} from './types';
const React=RecoveredReact as typeof RT;
const Slide=RecoveredSlide as RT.ComponentType<{slide:Row;theme:Row;groups:Row[];presenter?:string;date?:string}>;
function ActionIcon({kind}:{kind:'build'|'present'|'arrow'}){
 return <svg width={kind==='arrow'?24:30} height={kind==='arrow'?24:30} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==='build'?<><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M7 12h10"/></>:kind==='present'?<><rect x="2" y="3" width="20" height="15" rx="2"/><path d="m10 7 6 4-6 4zM8 21h8M12 18v3"/></>:<path d="M4 12h16m-6-6 6 6-6 6"/>}</svg>;
}
function MeetingPicture({meeting}:{meeting:Row}){
 const slide=meetingSlideRows(meeting.slides??[]).find(row=>!row.slide.skipped)?.slide;
 return <div className="home-tile-preview" aria-hidden="true" inert>{slide?<Slide slide={slide} theme={meeting.theme} groups={meeting.groups??[]} presenter={meeting.presenter} date={meeting.date}/>:<div className="home-empty-picture"><ActionIcon kind="present"/></div>}</div>;
}
export function HomeGuide({onBuild,onOpen}:{onBuild:(template?:Row)=>void;onOpen:(id:string)=>void}){
 const {state}=useApp() as {state:State},[today,setToday]=React.useState(homeDay);
 React.useEffect(()=>{const update=()=>setToday(homeDay()),timer=setInterval(update,60000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[]);
 const templates=state.templates.filter(template=>!template.archived&&globalThis.MMB.canUse(template)),template=templates.find(template=>template.id===state.settings.defaultTemplateId)??templates[0];
 const account=runtime.session?.account,meetings=state.meetings.filter(meeting=>!account||canReadMeeting(account,meeting));
 const location=runtime.hosted?(account?.location_id||globalThis.MMB.location||undefined):undefined;
 const saved=todaySavedMeeting(meetings,today,location),recent=recentHomeMeetings(meetings);
 const templatePreview=template?{id:template.id,theme:template.theme,groups:template.groups,date:today,slides:template.slides.map((definition:Row)=>({id:definition.id,definition:{...definition,templateLayout:template.layoutDefaults},items:[],skipped:!!definition.defaultSkipped}))}:undefined;
 return <>
  <header className="home-heading"><h1>{t('Today’s meeting')}</h1><p>{formatMeetingDate(today)}</p></header>
  <section className="start-panel home-guide" aria-label={t('Meeting shortcuts')}>
   <button type="button" className="home-action-tile home-build" aria-label={t('Build a new meeting')} onClick={()=>onBuild(template)}>
    <span className="home-tile-heading"><span className="home-action-icon"><ActionIcon kind="build"/></span><span className="home-action-title">{t('Build a new meeting')}</span><ActionIcon kind="arrow"/></span>
    {templatePreview?<MeetingPicture meeting={templatePreview}/>:<div className="home-empty-picture" aria-hidden="true"><ActionIcon kind="build"/></div>}
    <span className="home-tile-caption"><strong>{template?.name??t('Choose a template')}</strong><span>{template?t('Default template'):t('Choose a meeting template to get started.')}</span></span>
   </button>
   <button type="button" className="home-action-tile home-present" aria-label={t('Present a saved meeting')} disabled={!saved} onClick={()=>saved&&onOpen(saved.id)}>
    <span className="home-tile-heading"><span className="home-action-icon"><ActionIcon kind="present"/></span><span className="home-action-title">{t('Present a saved meeting')}</span><ActionIcon kind="arrow"/></span>
    {saved?<MeetingPicture meeting={saved}/>:<div className="home-empty-picture" aria-hidden="true"><ActionIcon kind="present"/></div>}
    <span className="home-tile-caption"><strong>{saved?.templateName??t('No meeting ready for today')}</strong><span>{saved?(saved.presenter||t('Presenter not set')):t('Save a meeting for today and it will appear here.')}</span></span>
   </button>
  </section>
  <section className="home-saved" aria-labelledby="home-saved-heading"><div className="section-heading"><h2 id="home-saved-heading">{t('Saved presentations')}</h2></div>
   {recent.length?<div className="recent-list">{recent.map(meeting=><button type="button" key={meeting.id} onClick={()=>onOpen(meeting.id)}><span className="recent-icon"><ActionIcon kind="present"/></span><span><strong>{meeting.templateName}</strong><small>{meeting.presenter||t('Presenter not set')} · {formatMeetingDate(meeting.date)}</small></span><span className="status-chip">{isMeetingExpired(meeting)?t('Presented'):meeting.status==='completed'?t('Completed'):meeting.status==='presenting'?t('Resume'):t('Ready to present')}</span><ActionIcon kind="arrow"/></button>)}</div>:<p className="home-saved-empty">{t('Your saved drafts and presented meetings will appear here.')}</p>}
  </section>
 </>;
}
