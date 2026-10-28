import type * as RT from 'react';
import {React as RecoveredReact} from '../recovered/index-DwifuW9D.js';
import {isPersonalShare} from './slide-policy';
import {slideFontSize} from './slide-typography';
import {slideLayout,contentMode} from './slide-layout';
import {t} from './i18n';
import type {Row} from './types';
const React=RecoveredReact as typeof RT;
function FitText({children,className}:{children:RT.ReactNode;className:string}){
 return <div className={'fit-text '+className}><div className="fit-text-inner">{children}</div></div>;
}
function useSlideTextFit(ref:RT.RefObject<HTMLDivElement|null>,fontSize:number,revision:unknown){
 React.useLayoutEffect(()=>{
  const el=ref.current;if(!el)return;let frame=0,closed=false;
  const fit=()=>{
   if(closed||!el.clientWidth||!el.clientHeight)return;
   const base=el.clientWidth*fontSize/1920;
   const set=(size:number)=>el.style.setProperty('--fitted-slide-font-size',size+'px');
   const fits=()=>{
    const body=el.querySelector<HTMLElement>('.safe-slide-body'),title=el.querySelector<HTMLElement>('.template-region'),content=el.querySelector<HTMLElement>('.content-region');if(!body||!title||!content)return true;
    const bounds=body.getBoundingClientRect(),t=title.getBoundingClientRect(),c=content.getBoundingClientRect();
    if(t.top<bounds.top-1||t.bottom>bounds.bottom+1||c.top<bounds.top-1||c.bottom>bounds.bottom+1)return false;
    if(content.textContent?.trim()||content.querySelector('.slide-item'))if(content.clientHeight<Math.min(12,body.clientHeight*.1))return false;
    return [...el.querySelectorAll<HTMLElement>('.fit-text')].every(box=>{const inner=box.firstElementChild as HTMLElement;return inner.getBoundingClientRect().height<=box.getBoundingClientRect().height+1&&inner.scrollWidth<=box.clientWidth+1;});
   };
   // Measure naturally wrapped text at the exact requested size first. Alignment
   // never changes the available width/height or forces an arbitrary smaller box.
   set(base);let chosen=base;
   if(!fits()){let low=base/100,high=base;for(let i=0;i<14;i++){const size=(low+high)/2;set(size);if(fits())low=size;else high=size;}chosen=low;set(chosen);}
   el.dataset.baseFont=String(base);el.dataset.fittedFont=String(chosen);el.dataset.textReduced=String(chosen<base-.05);
  };
  const resized=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);};
  const observer=new ResizeObserver(resized);observer.observe(el);fit();void document.fonts?.ready.then(resized);
  return()=>{closed=true;observer.disconnect();cancelAnimationFrame(frame);};
 },[ref,fontSize,revision]);
}
export function SafeSlide({slide,items,company,groupTitle,logo,style,presenter,date,renderItem,fontSize}:{slide:Row;items:Row[];company:string;groupTitle:string;logo?:string;style:RT.CSSProperties;presenter:string;date:string;renderItem:(item:Row)=>RT.ReactNode;fontSize?:number}){
 const canvas=React.useRef<HTMLDivElement>(null);const size=slideFontSize(fontSize);useSlideTextFit(canvas,size,slide);
 const def=slide.definition,layout=slideLayout(def,slide.layoutOverrides),mode=contentMode(items,slide.additionalText??''),position=layout[mode==='textOnly'?'textOnlyPosition':mode==='imageOnly'?'imageOnlyPosition':'imageTextPosition'];
 const media=items.filter(item=>['image','image-text','video','external-video'].includes(item.type)),text=items.filter(item=>item.description||!media.includes(item)||(mode==='imageText'&&def.type!=='gallery'&&def.title!=='Quote of the day'&&item.title!==def.title));
 const mediaLabel=mode==='imageOnly'&&media.length===1&&def.type!=='gallery'&&def.title!=='Quote of the day'&&media[0].title!==def.title?media[0].title:'';
 const templateText=def.text||(isPersonalShare(def)&&!items.length?t('Share a quick personal update. A photo or video is optional.'):'');
 const row=layout.titlePosition.split('-')[0],horizontal=layout.titlePosition.split('-')[1];
 return <div ref={canvas} className={`slide-canvas safe-layout ${media.length?'has-media':''}`} data-text-position={layout.titlePosition} data-title-row={row} data-content-mode={mode} data-content-position={position} data-media-placement={layout.mediaPlacement} style={{...style,"--slide-font-size":`${size/19.2}cqw`} as RT.CSSProperties}>
  <div className="slide-inner"><div className="slide-brand">{logo?<img src={logo} alt={t('Company logo')}/>:<span>{company}</span>}<span>{groupTitle}</span></div>
   <div className="safe-slide-body"><div className="template-region" data-horizontal={horizontal} data-vertical={row}><FitText className="template-fit"><div className="slide-heading"><span className="slide-line"/><h2>{def.title}</h2>{templateText&&<p className="template-body">{templateText}</p>}{def.type==='intro'&&<div className="presenter-line"><strong>{presenter}</strong><span>{date}</span></div>}</div></FitText></div>
    <div className="content-region"><div className={`content-frame mode-${mode} ${mediaLabel?'with-media-caption':''}`} data-position={position}>
     {mediaLabel&&<div className="media-caption"><FitText className="caption-fit"><h3>{mediaLabel}</h3></FitText></div>}
     {media.length>0&&<div className={`safe-media-region ${media.length>1?'multiple':''}`} style={{"--media-columns":Math.ceil(Math.sqrt(media.length)),"--media-rows":Math.ceil(media.length/Math.ceil(Math.sqrt(media.length)))} as RT.CSSProperties}>{media.map(item=><div className="slide-item" data-content-id={item.id} key={item.id}>{renderItem({...item,description:''})}</div>)}</div>}
     {(text.length>0||slide.additionalText)&&<FitText className="content-fit"><div className="content-text-stack">{text.map(item=><div className="library-text" data-content-id={item.id} key={item.id}>{item.title!==def.title&&def.type!=='gallery'&&def.title!=='Quote of the day'&&<h3>{item.title}</h3>}{item.description&&<p className="slide-body">{item.description}</p>}{item.type==='link'&&renderItem({...item,description:''})}</div>)}{slide.additionalText&&<div className="meeting-text"><p className="slide-body">{slide.additionalText}</p></div>}</div></FitText>}
    </div></div>
   </div><footer className="slide-footer"><span>{def.title}</span><span>{company}</span></footer>
  </div>
 </div>;
}
