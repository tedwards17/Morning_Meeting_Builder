import type * as RT from 'react';
import {React as RecoveredReact} from '../recovered/index-DwifuW9D.js';
import {isPersonalShare} from './slide-policy';
import {slideLayout,contentMode} from './slide-layout';
import {t} from './i18n';
import type {Row} from './types';
const React=RecoveredReact as typeof RT;
function FitText({children,className}:{children:RT.ReactNode;className:string}){
 const box=React.useRef<HTMLDivElement>(null),inner=React.useRef<HTMLDivElement>(null),[small,setSmall]=React.useState(false);
 React.useLayoutEffect(()=>{
  const el=box.current,content=inner.current;if(!el||!content)return;
  let frame=0;const fit=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!el.clientHeight||!el.clientWidth)return;content.style.fontSize='';const base=parseFloat(getComputedStyle(content).fontSize);let low=1,high=base;
   // Search the largest font that contains every line, including descenders.
   for(let i=0;i<12;i++){const size=(low+high)/2;content.style.fontSize=size+'px';if(content.scrollHeight<=el.clientHeight+1&&content.scrollWidth<=el.clientWidth+1)low=size;else high=size;}
   content.style.fontSize=low+'px';setSmall(low<base*.65);
  });};
  const observer=new ResizeObserver(fit);observer.observe(el);fit();void document.fonts?.ready.then(fit);return()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[children]);
 return <div ref={box} className={'fit-text '+className} data-small-text={small||undefined}><div ref={inner} className="fit-text-inner">{children}</div></div>;
}
export function SafeSlide({slide,items,company,groupTitle,logo,style,presenter,date,renderItem}:{slide:Row;items:Row[];company:string;groupTitle:string;logo?:string;style:RT.CSSProperties;presenter:string;date:string;renderItem:(item:Row)=>RT.ReactNode}){
 const def=slide.definition,layout=slideLayout(def,slide.layoutOverrides),mode=contentMode(items,slide.additionalText??''),position=layout[mode==='textOnly'?'textOnlyPosition':mode==='imageOnly'?'imageOnlyPosition':'imageTextPosition'];
 const media=items.filter(item=>['image','image-text','video','external-video'].includes(item.type)),text=items.filter(item=>item.description||!media.includes(item)||(mode==='imageText'&&def.type!=='gallery'&&def.title!=='Quote of the day'&&item.title!==def.title));
 const mediaLabel=mode==='imageOnly'&&media.length===1&&def.type!=='gallery'&&def.title!=='Quote of the day'&&media[0].title!==def.title?media[0].title:'';
 const templateText=def.text||(isPersonalShare(def)&&!items.length?t('Share a quick personal update. A photo or video is optional.'):'');
 const row=layout.titlePosition.split('-')[0],horizontal=layout.titlePosition.split('-')[1];
 return <div className={`slide-canvas safe-layout ${media.length?'has-media':''}`} data-text-position={layout.titlePosition} data-title-row={row} data-content-mode={mode} data-content-position={position} data-media-placement={layout.mediaPlacement} style={style}>
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
