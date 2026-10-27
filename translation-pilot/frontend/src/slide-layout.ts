import type {Row} from "./types";
import {positions} from "./slide-policy";
export type LayoutSettings={titlePosition:string;textOnlyPosition:string;imageOnlyPosition:string;imageTextPosition:string;mediaPlacement:string};
export const layoutDefaults:LayoutSettings={titlePosition:'top-left',textOnlyPosition:'middle-left',imageOnlyPosition:'middle-center',imageTextPosition:'middle-left',mediaPlacement:'left'};
export const layoutKeys=Object.keys(layoutDefaults) as (keyof LayoutSettings)[];
export function validLayout(value:unknown):Partial<LayoutSettings>{
 const out:Partial<LayoutSettings>={};if(!value||typeof value!=='object')return out;
 for(const key of layoutKeys){const v=(value as Record<string,unknown>)[key];if(typeof v==='string'&&(key==='mediaPlacement'?['left','right','top','bottom'].includes(v):positions.some(p=>p.value===v)))out[key]=v;}
 return out;
}
export function templateLayout(value?:unknown):LayoutSettings{return {...layoutDefaults,...validLayout(value)};}
export function slideLayout(def:Row,meeting?:unknown):LayoutSettings{
 const legacy=positions.some(p=>p.value===def.textPosition)?{titlePosition:def.textPosition}:{};
 const media={...(def.layout==='media-right'?{mediaPlacement:'right'}:def.layout==='full-media'?{mediaPlacement:'top'}:{})};
 const {titlePosition:_title,...content}=validLayout(meeting);
 return {...layoutDefaults,...media,...validLayout(def.templateLayout),...legacy,...validLayout(def.layoutOverrides),...content};
}
export function contentMode(items:Row[],additionalText=''):'textOnly'|'imageOnly'|'imageText'{
 const isMedia=(item:Row)=>['image','image-text','video','external-video'].includes(item.type)||/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(item.url??'');
 const media=items.some(isMedia),text=!!additionalText.trim()||items.some(i=>!!i.description?.trim()||!isMedia(i));
 return media?(text?'imageText':'imageOnly'):'textOnly';
}
export function removeUploadedItem(meeting:Row,slideId:string,itemId:string):Row{
 return {...meeting,slides:meeting.slides.map((slide:Row)=>slide.id===slideId?{...slide,items:slide.items.filter((item:Row)=>item.id!==itemId||item.scope!=='meeting-only')}:slide)};
}
