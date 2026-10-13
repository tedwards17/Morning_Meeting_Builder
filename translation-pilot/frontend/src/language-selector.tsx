import type * as RT from "react";
import { React as RecoveredReact } from "../recovered/index-DwifuW9D.js";
import { getLanguage, languages, setLanguage, subscribeLanguage, t } from "./i18n";
const React = RecoveredReact as typeof RT;

function Flag({country}: {country: string}) {
  return country === "US" ? <svg className="language-flag" viewBox="0 0 38 24" aria-hidden="true">
    <rect width="38" height="24" fill="white"/>
    {Array.from({length:7},(_,i)=><rect key={i} y={i*24/6.5} width="38" height={24/13} fill="#b22234"/>)}
    <rect width="16" height={24*7/13} fill="#3c3b6e"/>
    {Array.from({length:9},(_,row)=>Array.from({length:row%2?5:6},(_,col)=><path key={`${row}-${col}`} d="M0,-.65 .19,-.2 .68,-.2 .29,.09 .43,.55 0,.27 -.43,.55 -.29,.09 -.68,-.2 -.19,-.2Z" transform={`translate(${(col+1)*2.3+(row%2?1.15:0)},${(row+1)*1.25})`} fill="white"/>))}
  </svg> : <svg className="language-flag" viewBox="0 0 38 24" aria-hidden="true">
    <rect width="38" height="24" fill="white"/><rect width="12.67" height="24" fill="#006847"/><rect x="25.33" width="12.67" height="24" fill="#ce1126"/>
    <path d="M15.4 14.3Q15 18 19 18Q23 18 22.6 14.3M16 15.4 17 16.2M22 15.4 21 16.2" fill="none" stroke="#487747" strokeWidth=".8"/>
    <path d="M16 13.8 18 13 18 9 21 10 20 11 22 14 19.5 13.5 18 15Z" fill="#856438"/>
    <path d="M18.2 10.8 16 8 16.5 13 18.2 14.1M20.4 10.4Q22 9 22 12" fill="none" stroke="#756333" strokeWidth=".8"/>
    <path d="M16.5 15.3 22 15.3" stroke="#ac8e44" strokeWidth=".7"/>
  </svg>;
}
export function LanguageSelector() {
  const language = React.useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
  const [open,setOpen] = React.useState(false);
  const ref=React.useRef<HTMLDivElement>(null);
  const button=React.useRef<HTMLButtonElement>(null);
  const current=languages.find(item=>item.code===language)!;
  React.useEffect(()=>{
    if(!open)return;
    const close=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);ref.current?.querySelector<HTMLButtonElement>('button')?.focus();}};
    document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
  },[open]);
  return <div className="language-selector" ref={ref}>
    <button ref={button} type="button" className="language-button" title={current.name} aria-label={t("Switch interface language")} aria-expanded={open} aria-haspopup="true" onClick={()=>setOpen(!open)}>
      <Flag country={current.country}/>
    </button>
    {open&&<div className="language-menu" aria-label={t("Language")}>
      {languages.map(item=><button type="button" key={item.code} aria-pressed={language===item.code} onClick={()=>{setLanguage(item.code);setOpen(false);button.current?.focus();}}>
        <Flag country={item.country}/><span lang={item.locale}>{item.name}</span>{language===item.code&&<span aria-hidden="true">✓</span>}
      </button>)}
    </div>}
  </div>;
}
