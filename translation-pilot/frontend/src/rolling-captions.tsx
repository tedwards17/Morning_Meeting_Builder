import type * as RT from "react";
import { React as RecoveredReact } from "../recovered/index-DwifuW9D.js";
import {CaptionBuffer} from "./caption-buffer";
import type {Caption} from "./translation";
import {t} from "./i18n";
const React=RecoveredReact as typeof RT;
export function RollingCaptions({events}:{events:Caption[]}) {
  const element=React.useRef<HTMLDivElement>(null);
  const buffer=React.useRef(new CaptionBuffer());
  const seen=React.useRef(0);
  const [,render]=React.useState(0);
  const layout=React.useRef({width:1000,measure:(text:string)=>text.length*14});
  React.useLayoutEffect(()=>{
    const el=element.current;if(!el)return;
    const canvas=document.createElement("canvas");const context=canvas.getContext("2d");
    const size=()=>{const style=getComputedStyle(el);if(context)context.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      layout.current={width:Math.max(80,el.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)),measure:context?(text:string)=>context.measureText(text).width:(text:string)=>text.length*14};};
    size();const observer=new ResizeObserver(size);observer.observe(el);return ()=>observer.disconnect();
  },[]);
  React.useEffect(()=>{
    for(const event of events.slice(seen.current))buffer.current.add(event.text,event.source==="en"?"es":"en");
    seen.current=events.length;
    if(buffer.current.tick(Date.now(),layout.current.width,layout.current.measure))render(n=>n+1);
  },[events]);
  React.useEffect(()=>{const timer=setInterval(()=>{if(buffer.current.tick(Date.now(),layout.current.width,layout.current.measure))render(n=>n+1);},100);return ()=>clearInterval(timer);},[]);
  const lines=buffer.current.lines;
  return <div ref={element} className={`translation-caption rolling-captions ${lines.length?"has-lines":""}`} role="log" aria-label={t("Live translated captions")} aria-live="polite" aria-atomic="false">
    {lines.map(line=><p className="caption-line" key={line.id}>{line.words.map((word,index)=><React.Fragment key={index}>{index>0&&!word.continuation?" ":""}<span lang={word.language} className={`caption-${word.language}`}>{word.text}</span></React.Fragment>)}</p>)}
  </div>;
}
