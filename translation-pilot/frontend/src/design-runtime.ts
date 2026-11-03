import * as runtime from './runtime';
import * as db from './db';
import {media} from '../recovered/index-DwifuW9D.js';
import {t} from './i18n';
import type {Row} from './types';
let catalog:Row[]=[],loading:Promise<Row[]>|undefined;
const listeners=new Set<()=>void>();
export function designAssets(){return catalog.filter(row=>!runtime.hosted||row.organization_id===runtime.session?.account.organization_id);}
export function subscribeDesignAssets(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
function changed(){for(const fn of listeners)fn();}
export function refreshDesignAssets():Promise<Row[]>{
 if(loading)return loading;
 loading=(async()=>{
  catalog=(await db.get('meta','designAssets'))??[];
  if(runtime.hosted&&navigator.onLine&&runtime.session){await runtime.sync();catalog=(await runtime.api('design-assets')).records;await db.put('meta','designAssets',catalog);}
  changed();return designAssets();
 })().finally(()=>{loading=undefined;});return loading;
}
export const canManageDesignAssets=()=>!runtime.hosted||runtime.session?.account.role==='administrator';
export async function saveDesignAsset(record:Row):Promise<Row>{
 if(!canManageDesignAssets())throw new Error(t('Only administrators manage company illustrations and logos.'));
 if(loading)await loading;
 const saved=runtime.hosted?(await runtime.api('design-assets',{data:record,expected_version:record.version??0})).record:{...record,version:(record.version??0)+1};
 catalog=[...designAssets().filter(row=>row.id!==saved.id),saved];await db.put('meta','designAssets',catalog);changed();
 if(runtime.hosted)await runtime.sync();return saved;
}
async function localAnalysis(file:File):Promise<Partial<Row>>{
 const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=Math.min(160,bitmap.width);canvas.height=Math.min(160,bitmap.height);const ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,colors:number[][]=[];let empty=0;
 for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<35)empty++;if(pixels[i+3]>175)colors.push([pixels[i],pixels[i+1],pixels[i+2]]);}
 if(empty/(pixels.length/4)<.03)return {tintable:false,tintReason:'opaque'};
 if(colors.length<3)return {tintable:false,tintReason:'unsupported'};
 const uniform=[0,1,2].every(i=>{const values=colors.map(c=>c[i]);return Math.max(...values)-Math.min(...values)<=35;});
 return {tintable:uniform,tintReason:uniform?'single-color':'multicolor'};
}
export async function uploadDesignImage(file:File,templateId?:string):Promise<Row>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>15*1024*1024)throw new Error(t('Choose a JPEG, PNG or WebP image up to 15 MB.'));
 let asset:Row;
 if(runtime.hosted)asset=(await runtime.upload(file,templateId,true)).asset;
 else{const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');await media.write(hash,file);asset={id:crypto.randomUUID(),hash,name:file.name,mime:file.type,size:file.size,scope:'shared',createdAt:new Date().toISOString(),...await localAnalysis(file)};}
 if(globalThis.MMB.addMediaAssets)await globalThis.MMB.addMediaAssets([asset]);else await db.put('assets',asset.id,asset);
 await runtime.refreshAssets();return asset;
}
