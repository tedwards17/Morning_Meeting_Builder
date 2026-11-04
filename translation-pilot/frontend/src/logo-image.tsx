import type * as RT from 'react';
import {React as RecoveredReact} from '../recovered/index-DwifuW9D.js';
import {visibleBounds,logoFrame} from './image-layout';
import type {ImageBounds} from './image-layout';
import {t} from './i18n';
const React=RecoveredReact as typeof RT,cache=new Map<string,Promise<ImageBounds>>();
function boundsFor(url:string){
 let pending=cache.get(url);
 if(!pending){pending=new Promise<ImageBounds>((resolve,reject)=>{const img=new Image();img.onload=()=>{const w=img.naturalWidth,h=img.naturalHeight;try{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);resolve(visibleBounds(ctx.getImageData(0,0,w,h).data,w,h));}catch{resolve({x:0,y:0,width:w,height:h,fullWidth:w,fullHeight:h});}};img.onerror=()=>reject(new Error('Logo unavailable'));img.src=url;});cache.set(url,pending);if(cache.size>40)cache.delete(cache.keys().next().value!);}
 return pending;
}
export function LogoImage({url,size,trim=true}:{url:string;size?:number;trim?:boolean}){
 const [bounds,setBounds]=React.useState<{url:string;value:ImageBounds}>();
 React.useEffect(()=>{let closed=false;void boundsFor(url).then(value=>{if(!closed)setBounds({url,value});}).catch(()=>{});return()=>{closed=true;};},[url]);
 const b=bounds?.url===url?bounds.value:{x:0,y:0,width:1,height:1,fullWidth:1,fullHeight:1},layout=logoFrame(b,size,trim);
 return <span className="logo-frame" style={{width:layout.width,height:layout.height}} data-logo-trim={trim}><img src={url} alt={t('Company logo')} style={layout.image}/></span>;
}
