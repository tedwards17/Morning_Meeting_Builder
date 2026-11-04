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
export async function saveDesignAsset(record:Row,templateId?:string):Promise<Row>{
 if(loading)await loading;
 const saved=runtime.hosted?(await runtime.api('design-assets',{data:record,expected_version:record.version??0,template_id:templateId})).record:{...record,version:(record.version??0)+1};
 catalog=[...designAssets().filter(row=>row.id!==saved.id),saved];await db.put('meta','designAssets',catalog);changed();
 if(runtime.hosted)await runtime.sync();return saved;
}
export async function uploadDesignImage(file:File,templateId?:string):Promise<Row>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>15*1024*1024)throw new Error(t('Choose a JPEG, PNG or WebP image up to 15 MB.'));
 let asset:Row;
 if(runtime.hosted)asset=(await runtime.upload(file,templateId,true)).asset;
 else{const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');await media.write(hash,file);asset={id:crypto.randomUUID(),hash,name:file.name,mime:file.type,size:file.size,scope:'shared',createdAt:new Date().toISOString()};}
 if(globalThis.MMB.addMediaAssets)await globalThis.MMB.addMediaAssets([asset]);else await db.put('assets',asset.id,asset);
 await runtime.refreshAssets();return asset;
}
