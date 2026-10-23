import type {Row} from "./types";
export function isPersonalShare(slide:Row):boolean {
  return slide.personalShare===true || slide.id==="00000000-0000-4000-8000-000000001001" || slide.title?.trim().toLowerCase()==="personal share";
}
export function slidePolicy(slide:Row):Row {
  if (slide.type === "stretch" && slide.id === "00000000-0000-4000-8000-000000001002" && !slide.libraryId)
    return {...slide,libraryId:"00000000-0000-4000-8000-000000000002"};
  return isPersonalShare(slide)?{...slide,personalShare:true,optional:false,mediaOptional:true,defaultSkipped:false}:slide;
}
export function normalizeUnstartedMeeting(meeting:Row):Row {
  if(meeting.startedAt || meeting.status === "completed" || meeting.status === "presenting")return meeting;
  return {...meeting,slides:meeting.slides.map((slide:Row)=>isPersonalShare(slide.definition)?{...slide,definition:slidePolicy(slide.definition),skipped:false}:{...slide,definition:slidePolicy(slide.definition)})};
}

export function templateDefaults(template:Row):Row {
  return {...template,slides:template.slides.map((slide:Row)=>{
    const personal=slidePolicy(slide);
    if(template.id==="00000000-0000-4000-8000-000000000600" && slide.id==="00000000-0000-4000-8000-000000001008" && slide.defaultSkipped===undefined)
      return {...personal,optional:true,defaultSkipped:true};
    return personal;
  })};
}

export const builderColors = [
  {value:"#bdd5e8",label:"Soft blue"},{value:"#bfd8c5",label:"Soft green"},
  {value:"#ead7ad",label:"Soft amber"},{value:"#d8cbe7",label:"Soft lavender"},
  {value:"#e6c7cf",label:"Soft rose"},{value:"#cdd5da",label:"Soft gray"},
];
export function builderColor(slide:Row):string|undefined {
  return /^#[0-9a-f]{6}$/i.test(slide.builderColor??"")?slide.builderColor:undefined;
}
