import type * as RT from "react";
import {React as RecoveredReact} from "../recovered/index-DwifuW9D.js";
import {t} from "./i18n";
import {positions,slideKind} from "./slide-policy";
import type {Row} from "./types";
const React=RecoveredReact as typeof RT;
export function ColorControl({label,value,onChange,optional=false}:{label:string;value?:string;onChange:(value:string|undefined)=>void;optional?:boolean}){
 const [text,setText]=React.useState(value??"");React.useEffect(()=>setText(value??""),[value]);
 const valid=(v:string)=>/^#[a-f0-9]{6}$/i.test(v);
 return <div className="color-control"><span>{label}</span><div className="color-inputs"><input type="color" aria-label={label} value={valid(value??"")?value:"#ffffff"} onChange={e=>onChange(e.target.value)}/><input aria-label={t("{arg0} hex",{arg0:label})} value={text} placeholder="#ffffff" maxLength={7} spellCheck={false} onChange={e=>{setText(e.target.value);if(valid(e.target.value))onChange(e.target.value);}} onBlur={()=>setText(value??"")}/></div>{optional&&<button type="button" className="text-button" onClick={()=>onChange(undefined)}>{t("No highlight")}</button>}</div>;
}
export function ThemeColors({theme,onChange}:{theme:Row;onChange:(theme:Row)=>void}){
 return <div className="theme-colors">{([['background',t('Background')],['foreground',t('Text color')],['accent',t('Accent color')]]).map(([key,label])=><ColorControl key={key} label={label} value={theme[key]} onChange={color=>onChange({...theme,[key]:color})}/>)}</div>;
}
export function PositionPicker({value,onChange}:{value?:string;onChange:(value:string)=>void}){
 const [open,setOpen]=React.useState(false),ref=React.useRef<HTMLDivElement>(null),trigger=React.useRef<HTMLButtonElement>(null);
 const current=positions.findIndex(p=>p.value===value),index=current<0?4:current;
 React.useEffect(()=>{if(!open)return;const dismiss=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',dismiss);ref.current?.querySelector<HTMLButtonElement>(`[data-position="${positions[index].value}"]`)?.focus();return()=>document.removeEventListener('pointerdown',dismiss);},[open,index]);
 const choose=(i:number)=>{onChange(positions[i].value);setOpen(false);trigger.current?.focus();};
 return <div className="position-control" ref={ref}><span>{t("Text position")}</span><button type="button" ref={trigger} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{current<0?t("Current layout"):t(positions[index].label)} <span aria-hidden="true">▦</span></button>{open&&<div role="dialog" aria-label={t("Choose text position")} className="position-popup" onKeyDown={e=>{let next=index;if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.current?.focus();return;}if(e.key==='ArrowLeft')next=(index+8)%9;else if(e.key==='ArrowRight')next=(index+1)%9;else if(e.key==='ArrowUp')next=(index+6)%9;else if(e.key==='ArrowDown')next=(index+3)%9;else if(e.key==='Home')next=0;else if(e.key==='End')next=8;else return;e.preventDefault();onChange(positions[next].value);}}><div role="radiogroup" aria-label={t("Text position")} className="position-grid">{positions.map((p,i)=><button key={p.value} type="button" role="radio" data-position={p.value} aria-label={t(p.label)} title={t(p.label)} aria-checked={value===p.value} tabIndex={i===index?0:-1} onClick={()=>choose(i)}><span aria-hidden="true">•</span></button>)}</div></div>}</div>;
}
export function SlideTypeControl({slide,onChange}:{slide:Row;onChange:(change:Partial<Row>)=>void}){
 const kind=slideKind(slide);
 return <><label className="field">{t("Slide type")}<select aria-label={t("Slide type")} value={kind} onChange={e=>onChange({type:({standard:'text',library:'library',media:'gallery'})[e.target.value],count:1,allowRepeat:true,duration:0})}><option value="standard">{t("Standard")}</option><option value="library">{t("Library content")}</option><option value="media">{t("Media")}</option></select></label>{kind==='media'&&<label className="field">{t("Web link (optional)")}<input type="url" aria-label={t("Web link (optional)")} value={slide.mediaUrl??''} maxLength={3000} placeholder="https://" onChange={e=>onChange({mediaUrl:e.target.value})}/><small>{t("YouTube links use the video player. Other links open their original website.")}</small></label>}</>;
}
