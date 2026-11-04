import type * as RT from 'react';
import {React as RecoveredReact} from '../recovered/index-DwifuW9D.js';
import {t} from './i18n';
const React=RecoveredReact as typeof RT;

// Keep the existing iframe mounted. Moving it into a portal or recreating the
// player can restart playback; expanding in place also works inside fullscreen.
export function VideoFrame({children}:{children:RT.ReactNode}){
 const frame=React.useRef<HTMLDivElement>(null),button=React.useRef<HTMLButtonElement>(null);
 const [presenting,setPresenting]=React.useState(false),[expanded,setExpanded]=React.useState(false);
 React.useLayoutEffect(()=>setPresenting(!!frame.current?.closest('.presentation')),[]);
 React.useLayoutEffect(()=>{
  const el=frame.current,presentation=el?.closest<HTMLElement>('.presentation');
  if(!expanded||!el||!presentation)return;
  const restores:(()=>void)[]=[];
  // Container queries and clipped ancestors otherwise constrain fixed children.
  for(let parent=el.parentElement;parent&&parent!==presentation;parent=parent.parentElement){
   for(const [property,value] of [['contain','none'],['container-type','normal'],['transform','none'],['filter','none'],['perspective','none'],['overflow','visible']]){
    const node=parent,old=node.style.getPropertyValue(property),priority=node.style.getPropertyPriority(property);
    node.style.setProperty(property,value,'important');
    restores.push(()=>{if(node.style.getPropertyValue(property)===value&&node.style.getPropertyPriority(property)==='important'){if(old)node.style.setProperty(property,old,priority);else node.style.removeProperty(property);}});
   }
  }
  presentation.classList.add('video-expanded');
  const collapse=()=>{setExpanded(false);requestAnimationFrame(()=>button.current?.focus({preventScroll:true}));};
  const key=(event:KeyboardEvent)=>{if((event.target as Element)?.closest?.('dialog'))return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();collapse();}};
  // The existing scoped history guard delegates Back before opening Pause.
  // This avoids competing popstate listeners and never adds a nested entry.
  document.addEventListener('keydown',key,true);el.addEventListener('mmb-video-collapse',collapse);
  const target=el.querySelector<HTMLButtonElement>('.video-return');target?.focus({preventScroll:true});
  return()=>{document.removeEventListener('keydown',key,true);el.removeEventListener('mmb-video-collapse',collapse);presentation.classList.remove('video-expanded');restores.reverse().forEach(restore=>restore());};
 },[expanded]);
 const stop=(event:RT.SyntheticEvent)=>event.stopPropagation();
 return <div ref={frame} className={`video-expand-frame ${expanded?'is-expanded':''}`}>
  {children}
  {presenting&&!expanded&&<button ref={button} type="button" className="video-expand-button" aria-label={t('Expand video')} title={t('Expand video')} onPointerDown={stop} onPointerMove={stop} onClick={event=>{stop(event);setExpanded(true);}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button>}
  {expanded&&<button type="button" className="video-return" onPointerDown={stop} onPointerMove={stop} onClick={event=>{stop(event);setExpanded(false);requestAnimationFrame(()=>button.current?.focus({preventScroll:true}));}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m12 5-7 7 7 7m-7-7h14"/></svg>{t('Back to slide')}</button>}
 </div>;
}
