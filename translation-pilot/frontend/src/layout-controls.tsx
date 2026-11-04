import {slideFonts,slideFontSize} from './slide-typography';
import type * as RT from 'react';
import {React as RecoveredReact} from '../recovered/index-DwifuW9D.js';
import {PositionPicker} from './slide-controls';
import {templateLayout,slideLayout,contentMode,type LayoutSettings} from './slide-layout';
import {t} from './i18n';
import type {Row} from './types';
const React=RecoveredReact as typeof RT;
function Placement({value,onChange}:{value:string;onChange:(value:string)=>void}){
 return <label className="field">{t('Image and text arrangement')}<select aria-label={t('Image and text arrangement')} value={value} onChange={e=>onChange(e.target.value)}><option value="left">{t('Media left, text right')}</option><option value="right">{t('Media right, text left')}</option><option value="top">{t('Media above text')}</option><option value="bottom">{t('Media below text')}</option></select></label>;
}
function Settings({value,onChange}:{value:LayoutSettings;onChange:(next:LayoutSettings)=>void}){
 return <div className="layout-settings"><PositionPicker label={t('Title and template text position')} value={value.titlePosition} onChange={titlePosition=>onChange({...value,titlePosition})}/>{([['textOnlyPosition',t('Text only')],['imageOnlyPosition',t('Image only')],['imageTextPosition',t('Image + Text')]] as const).map(([key,label])=><details key={key}><summary>{label}</summary><PositionPicker label={t('{arg0} position',{arg0:label})} value={value[key]} onChange={position=>onChange({...value,[key]:position})}/>{key==='imageTextPosition'&&<Placement value={value.mediaPlacement} onChange={mediaPlacement=>onChange({...value,mediaPlacement})}/>}</details>)}</div>;
}
export function TemplateLayoutDefaults({value,onChange}:{value?:Row;onChange:(next:LayoutSettings)=>void}){
 return <details className="template-layout-defaults"><summary>{t('Slide layout defaults')}</summary><p className="muted">{t('Defaults apply to slides using this template. Each slide can override them. Titles and template text keep a reserved area; content and media never cover it.')}</p><Settings value={templateLayout(value)} onChange={onChange}/></details>;
}
export function SlideLayoutControls({slide,defaults,onChange}:{slide:Row;defaults?:Row;onChange:(patch:Partial<Row>)=>void}){
 const custom=!!slide.layoutOverrides||!!slide.textPosition;const value=slideLayout({...slide,templateLayout:templateLayout(defaults)});
 return <details className="slide-layout-controls"><summary>{t('Slide layout')}</summary><label className="check"><input type="checkbox" checked={!custom} onChange={e=>onChange(e.target.checked?{layoutOverrides:undefined,textPosition:undefined}:{layoutOverrides:value,textPosition:undefined})}/>{t('Use template layout defaults')}</label>{custom?<Settings value={value} onChange={layoutOverrides=>onChange({layoutOverrides,textPosition:undefined})}/>:<p className="muted">{t('Using template layout defaults. Clear the checkbox to customize this slide.')}</p>}</details>;
}
function MeetingTitle({slide,onChange}:{slide:Row;onChange:(patch:Partial<Row>)=>void}){
 const [draft,setDraft]=React.useState(slide.definition.title);
 React.useEffect(()=>setDraft(slide.definition.title),[slide.id,slide.definition.title]);
 return <label className="field"><span>{t('Title')}</span><input aria-label={t('Title')} maxLength={300} value={draft} onChange={e=>{setDraft(e.target.value);if(e.target.value.trim())onChange({definition:{...slide.definition,title:e.target.value}});}} onBlur={()=>setDraft(slide.definition.title)}/></label>;
}
export function MeetingTextControls({slide,onChange}:{slide:Row;onChange:(patch:Partial<Row>)=>void}){
 const value=slideLayout(slide.definition,slide.layoutOverrides),mode=contentMode(slide.items,slide.additionalText??''),key=mode==='textOnly'?'textOnlyPosition':mode==='imageOnly'?'imageOnlyPosition':'imageTextPosition';
 return <div className="meeting-text-controls"><MeetingTitle slide={slide} onChange={onChange}/><label className="field"><span>{t('Additional meeting text')}</span><textarea aria-label={t('Additional meeting text')} rows={2} maxLength={20000} value={slide.additionalText??''} onChange={e=>onChange({additionalText:e.target.value})}/></label><div className="meeting-position-row"><PositionPicker label={t('Content position')} value={value[key]} onChange={position=>onChange({layoutOverrides:{...slide.layoutOverrides,[key]:position}})}/><button className="reset-content-layout" type="button" onClick={()=>onChange({layoutOverrides:undefined})}>{t('Use slide content layout')}</button></div>{mode==='imageText'&&<Placement value={value.mediaPlacement} onChange={mediaPlacement=>onChange({layoutOverrides:{...slide.layoutOverrides,mediaPlacement}})}/>}</div>;
}

function FontSizeField({label,value,onChange}:{label:string;value?:number;onChange:(size:number)=>void}){
 const current=slideFontSize(value),[text,setText]=React.useState(String(current));
 React.useEffect(()=>setText(String(current)),[current]);
 const valid=(n:number)=>Number.isInteger(n)&&n>=16&&n<=96;
 return <label className="field template-font-control">{label}<input aria-label={label} type="number" min={16} max={96} step={1} value={text} onChange={e=>{setText(e.target.value);const n=Number(e.target.value);if(valid(n))onChange(n);}} onBlur={()=>{const n=Number(text);setText(String(valid(n)?n:current));}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/></label>;
}

export function TemplateFontControl({theme,onChange}:{theme:Row;onChange:(theme:Row)=>void}){
 const sizes=slideFonts(theme);
 return <div className="template-font-settings"><div className="template-font-row"><FontSizeField label={t('Title font size')} value={sizes.title} onChange={titleFontSize=>onChange({...theme,titleFontSize})}/><FontSizeField label={t('Text font size')} value={sizes.text} onChange={textFontSize=>onChange({...theme,textFontSize})}/></div><small>{t('Title size applies to slide and content titles. Text size applies to template, library and meeting text on every slide. Text wraps before shrinking. Choose 16–96.')}</small></div>;
}
