import type {Row} from "./types";

// A completed meeting's details come from the saved record. Only additive speech
// and missing translations can arrive after the presenter confirms completion.
export function mergeCompletedMeeting(saved:Row, incoming:Row):Row {
  if(!saved.transcript&&!incoming.transcript)return {...saved};
  const entries:Row[]=(saved.transcript??[]).map((entry:Row)=>structuredClone(entry));
  const byId=new Map(entries.map(entry=>[entry.id,entry]));
  for(const entry of incoming.transcript??[]) {
    const original=byId.get(entry.id);
    if(original) {
      if(original.translations||entry.translations)
        original.translations={...entry.translations,...original.translations};
    }else {const copy=structuredClone(entry);entries.push(copy);byId.set(copy.id,copy);}
  }
  return {...saved,transcript:entries};
}
