import type {Row} from './types';
export function locationUse(template:Row,id:string):boolean{return !!template.company_visible||(template.access??[]).some((row:Row)=>row.location_id===id&&row.can_use);}
export function setLocationUse(template:Row,locations:Row[],enabled:boolean):Row{
 const ids=new Set(locations.map(row=>row.id)),prior=template.access??[];
 return {...template,access:[...prior.filter((row:Row)=>!ids.has(row.location_id??'')),...locations.map(location=>({...prior.find((row:Row)=>row.location_id===location.id),location_id:location.id,can_use:enabled}))]};
}
