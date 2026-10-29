import {describe,it,expect} from 'vitest';
import {slideFonts,slideFontSize} from '../../frontend/src/slide-typography';
describe('shared template typography',()=>{
 it('uses a consistent legacy default and accepts supported integer sizes',()=>{expect(slideFontSize(undefined)).toBe(48);expect(slideFontSize(16)).toBe(16);expect(slideFontSize(64)).toBe(64);expect(slideFontSize(96)).toBe(96);});
 it('recovers safely from invalid imported values',()=>{for(const value of [0,15,97,-1,48.5,NaN,Infinity,'64',null,{}])expect(slideFontSize(value)).toBe(48);});
});

it('inherits legacy size independently and restores split sizes',()=>{expect(slideFonts({fontSize:64})).toEqual({title:64,text:64});expect(slideFonts({fontSize:64,titleFontSize:72,textFontSize:32})).toEqual({title:72,text:32});expect(slideFonts({fontSize:64,textFontSize:32})).toEqual({title:64,text:32});expect(slideFonts()).toEqual({title:48,text:48});});
