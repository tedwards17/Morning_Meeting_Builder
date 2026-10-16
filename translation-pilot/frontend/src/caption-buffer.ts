export type CaptionWord = {text:string;language:"en"|"es";continuation?:boolean};
export type CaptionLine = {id:number;words:CaptionWord[];updated:number;width:number};
export const CAPTION_MIN_MS=8000;
export const CAPTION_IDLE_MS=10000;
// An append-only roll-up window. Full rows wait their reading time before moving out.
export class CaptionBuffer {
  lines:CaptionLine[]=[];
  pending:CaptionWord[]=[];
  private sequence=0;
  private lastPublished=0;
  private lastRoll=-Infinity;
  private lineWidth:number|undefined;
  add(text:string,language:"en"|"es") {
    this.pending.push(...text.trim().split(/\s+/).filter(Boolean).map(text=>({text,language})));
  }
  tick(now:number,width:number,measure:(text:string)=>number):boolean {
    let changed=false;
    if(this.lineWidth!==undefined&&Math.abs(this.lineWidth-width)>1) {
      this.pending=[...this.lines.flatMap(row=>row.words),...this.pending];this.lines=[];changed=true;
    }
    this.lineWidth=width;
    while(this.pending.length) {
      const word=this.pending[0];let row=this.lines.at(-1);
      if(measure(word.text)>width&&Array.from(word.text).length>1) {
        const chunks:string[]=[];let chunk="";
        for(const letter of word.text){if(chunk&&measure(chunk+letter)>width){chunks.push(chunk);chunk="";}chunk+=letter;}
        if(chunk)chunks.push(chunk);
        this.pending.splice(0,1,...chunks.map((text,index)=>({...word,text,continuation:word.continuation||index>0})));continue;
      }
      const extra=measure((row?.words.length&&!word.continuation?" ":"")+word.text);
      if(!row||row.width+extra>width) {
        if(this.lines.length===3) {
          if(now-this.lines[0].updated<CAPTION_MIN_MS||now-this.lastRoll<2200)break;
          this.lines.shift();this.lastRoll=now;
        }
        row={id:++this.sequence,words:[],updated:now,width:0};this.lines.push(row);
      }
      this.pending.shift();row.width+=measure((row.words.length&&!word.continuation?" ":"")+word.text);row.words.push(word);row.updated=now;this.lastPublished=now;changed=true;
    }
    if(!this.pending.length&&this.lines.length&&now-this.lastPublished>=CAPTION_IDLE_MS){this.lines=[];changed=true;}
    return changed;
  }
}
