import introduction from './illustrations/introduction.svg';
import stretching from './illustrations/stretching.svg';
import safety from './illustrations/safety.svg';
import vocabulary from './illustrations/vocabulary.svg';
import lean from './illustrations/lean.svg';
import recognition from './illustrations/recognition.svg';
import ownership from './illustrations/ownership.svg';
import dismissal from './illustrations/dismissal.svg';
import {builderColor} from './slide-policy';
import type {Row} from './types';
export const illustrations=[
 {id:'introduction',label:'Introduction / Personal share',url:introduction},
 {id:'stretching',label:'Stretch it out',url:stretching},
 {id:'safety',label:'Safety moment',url:safety},
 {id:'vocabulary',label:'Vocabulary',url:vocabulary},
 {id:'lean',label:'Lean lesson',url:lean},
 {id:'recognition',label:'Recognition and gratitude',url:recognition},
 {id:'ownership',label:'Problems and ownership',url:ownership},
 {id:'dismissal',label:'Motivate and dismiss',url:dismissal},
];
export function illustrationColor(definition:Row):string|undefined {
 const art=definition.illustration;
 return art?.matchHighlight&&(art.builtin||art.tintable===true)?builderColor(definition):undefined;
}
export function illustrationBacking(color?:string):string {
 if(!color)return '#ffffff';
 const [r,g,b]=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 return (r*.299+g*.587+b*.114)>155?'#17232e':'#ffffff';
}
