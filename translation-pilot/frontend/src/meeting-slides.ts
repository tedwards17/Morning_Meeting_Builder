import type {Row} from './types';

// The stored array includes an internal announcement placement marker. Display
// positions come from current real slides; storage indices remain edit targets.
export function meetingSlideRows(slides:Row[]) {
 const rows:{slide:Row;index:number;number:number}[]=[];
 slides.forEach((slide,index)=>{if(!slide.definition?.announcementSlot)rows.push({slide,index,number:rows.length+1});});
 return rows;
}
export function selectedMeetingRow(rows:ReturnType<typeof meetingSlideRows>,requestedIndex:number) {
 return rows.find(row=>row.index===requestedIndex)??rows.find(row=>row.index>requestedIndex)??rows.at(-1);
}
export function moveMeetingSlide(slides:Row[],slideId:string,targetPosition:number) {
 const rows=meetingSlideRows(slides),from=rows.findIndex(row=>row.slide.id===slideId);
 if(from<0||targetPosition<0||targetPosition>=rows.length)return slides;
 const ordered=rows.map(row=>row.slide),[moving]=ordered.splice(from,1);ordered.splice(targetPosition,0,moving);
 let next=0;
 // Keep hidden announcement placement markers intact and in their stored slots.
 return slides.map(slide=>slide.definition?.announcementSlot?slide:ordered[next++]);
}
