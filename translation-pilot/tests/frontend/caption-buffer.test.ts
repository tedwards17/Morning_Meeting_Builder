import {expect,it} from "vitest";
import {CaptionBuffer} from "../../frontend/src/caption-buffer";
const measure=(text:string)=>text.length;
it("appends short phrases without replacing a readable phrase",()=>{
 const buffer=new CaptionBuffer();buffer.add("The truck is ready","en");buffer.tick(1000,40,measure);buffer.add("today","en");buffer.tick(1200,40,measure);
 expect(buffer.lines.flatMap(line=>line.words).map(word=>word.text).join(" ")).toBe("The truck is ready today");
});
it("holds full lines for eight seconds, queues new words, then rolls in order",()=>{
 const buffer=new CaptionBuffer();buffer.add("one two three four five six seven eight nine ten eleven twelve","en");buffer.tick(1000,10,measure);
 expect(buffer.lines).toHaveLength(3);const first=buffer.lines[0].words.map(word=>word.text).join(" ");expect(buffer.pending.length).toBeGreaterThan(0);
 buffer.tick(8999,10,measure);expect(buffer.lines[0].words.map(word=>word.text).join(" ")).toBe(first);
 buffer.tick(9000,10,measure);expect(buffer.lines[0].words.map(word=>word.text).join(" ")).not.toBe(first);
});
it("retains final words for ten seconds and carries each word's displayed language",()=>{
 const buffer=new CaptionBuffer();buffer.add("Hello","en");buffer.add("Buenos días","es");buffer.tick(1000,100,measure);
 expect(buffer.lines[0].words.map(word=>word.language)).toEqual(["en","es","es"]);
 buffer.tick(10999,100,measure);expect(buffer.lines.length).toBe(1);buffer.tick(11000,100,measure);expect(buffer.lines.length).toBe(0);
});

it("rolls one row at a time even when several old rows are eligible",()=>{
 const b=new CaptionBuffer();b.add("one two three four five six seven eight nine ten eleven twelve thirteen","en");b.tick(1000,10,measure);const second=b.lines[1].id;
 b.tick(9000,10,measure);expect(b.lines[0].id).toBe(second);b.tick(9100,10,measure);expect(b.lines[0].id).toBe(second);
 b.tick(11200,10,measure);expect(b.lines[0].id).not.toBe(second);
});
it("reflows existing words on resize and splits oversized words without losing characters",()=>{
 const b=new CaptionBuffer();b.add("abcdefghijklmno","es");b.tick(1000,30,measure);b.tick(2000,5,measure);
 expect(b.lines).toHaveLength(3);expect(b.lines.every(row=>row.width<=5)).toBe(true);expect(b.lines.flatMap(row=>row.words).map(w=>w.text).join("")).toBe("abcdefghijklmno");
});
