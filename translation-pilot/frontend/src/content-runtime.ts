import * as runtime from "./runtime";
import * as db from "./db";
import {t} from "./i18n";
import {sharedWith} from "./content-selection";
import type {Row} from "./types";
export type ContentContext = {location:string;locations:Row[];available:string[];enabled:string[];canManage:boolean;canDelete:boolean;limits?:{image:number;video:number}};
let current:ContentContext={location:"",locations:[],available:[],enabled:[],canManage:false,canDelete:false};
let activeLocation="";
let meetingLocation="";
let generation=0;
export function contentContext(){return current;}
export function contentLocation(){return runtime.session?.account.location_id || meetingLocation || globalThis.MMB.location || activeLocation || "";}
export async function refreshContentContext(){
 const token=++generation;
 if(runtime.hosted){
  const location=runtime.session?.account.location_id || meetingLocation || globalThis.MMB.location || await db.get("meta","location") || "";
  const result=await runtime.api("content/rotation"+(location?"?location="+encodeURIComponent(location):""));
  if(token!==generation)return current;
  current=result;
 }else{
  const s=await runtime.repository.load();activeLocation=s.device.id;
  const enabled=await db.get("meta","demoRotation");
  // The local demo's pre-upgrade content is its initial pool; newly created items never opt in.
  if(!enabled)await db.put("meta","demoRotation",s.items.filter(i=>!i.archived).map(i=>i.id));
  current={location:activeLocation,locations:[{id:activeLocation,name:s.device.name,enabled:true}],available:s.items.filter(i=>!i.archived&&sharedWith(i,activeLocation)).map(i=>i.id),enabled:enabled??s.items.filter(i=>!i.archived).map(i=>i.id),canManage:true,canDelete:true};
 }
 await db.put("meta","contentContext",current);runtime.announce();return current;
}
export async function loadContentContext(){current=await db.get("meta","contentContext")??current;}
export function isContentAvailable(item:Row,location=contentLocation()):boolean {
 if(item.archived)return false;
 if(!location)return !runtime.hosted || !runtime.session?.account.location_id;
 if(current.location!==location)return false;
 return current.available.includes(item.id) && sharedWith(item,location);
}
export function isInRotation(item:Row):boolean {return !!current.location && isContentAvailable(item,current.location) && current.enabled.includes(item.id);}
export function setContentMeetingLocation(id:string){
 if(meetingLocation===id)return;meetingLocation=id;globalThis.MMB.meetingLocation=id;runtime.announce();
 void refreshContentContext().catch(runtime.reportError);
}
export async function chooseContentLocation(id:string){
 if(meetingLocation&&id!==meetingLocation)throw new Error(t("Close the current meeting before choosing another location."));
 globalThis.MMB.location=id;current={...current,location:"",available:[],enabled:[],canManage:false};runtime.announce();await db.put("meta","location",id);await refreshContentContext();await globalThis.MMB.refresh?.();
}
export async function setRotation(item:Row,enabled:boolean){
 if(!current.location)throw new Error(t("Choose a meeting location before managing rotation."));
 if(runtime.hosted)await runtime.api("content/rotation",{location_id:current.location,content_id:item.id,enabled});
 else await db.put("meta","demoRotation",enabled?[...new Set([...current.enabled,item.id])]:current.enabled.filter(id=>id!==item.id));
 await refreshContentContext();
}
export async function deleteCompanyContent(item:Row,mode:"archive"|"permanent"="archive"){
 if(runtime.hosted) {await runtime.api(`content/${item.id}/delete`,{expected_version:item.version??0,mode});await runtime.sync();}
 else {const state=await runtime.repository.load();state.items=mode==="permanent"?state.items.filter(i=>i.id!==item.id):state.items.map(i=>i.id===item.id?{...i,archived:true}:i);await db.put("meta","demoRotation",current.enabled.filter(id=>id!==item.id));await runtime.repository.save(state);await refreshContentContext();}
 await globalThis.MMB.refresh?.();
}
