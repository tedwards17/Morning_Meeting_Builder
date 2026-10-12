import {describe,it,expect} from "vitest";
import {remoteDirection,learnableKey} from "../../frontend/src/remote";
const event=(key:string,extra={})=>({key,repeat:false,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,...extra});
describe("presentation remotes",()=>{
  it("recognizes keyboard page, arrow and space keys",()=>{
    for(const key of ["PageDown","ArrowRight","ArrowDown"," ","Enter"])expect(remoteDirection(event(key))).toBe(1);
    for(const key of ["PageUp","ArrowLeft","ArrowUp","Backspace"])expect(remoteDirection(event(key))).toBe(-1);
  });
  it("ignores held keys, shortcuts and Escape",()=>{for(const e of [event("PageDown",{repeat:true}),event("ArrowRight",{ctrlKey:true}),event("Escape")])expect(remoteDirection(e)).toBe(0);});
  it("accepts learned keys but rejects reserved/unidentified learning",()=>{expect(remoteDirection(event("x"),{next:"x"})).toBe(1);expect(learnableKey("Escape")).toBe(false);expect(learnableKey("Unidentified")).toBe(false);});
});
