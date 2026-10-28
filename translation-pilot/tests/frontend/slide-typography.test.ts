import {describe,it,expect} from 'vitest';
import {slideFontSize} from '../../frontend/src/slide-typography';
describe('shared template typography',()=>{
 it('uses a consistent legacy default and accepts supported integer sizes',()=>{expect(slideFontSize(undefined)).toBe(48);expect(slideFontSize(16)).toBe(16);expect(slideFontSize(64)).toBe(64);expect(slideFontSize(96)).toBe(96);});
 it('recovers safely from invalid imported values',()=>{for(const value of [0,15,97,-1,48.5,NaN,Infinity,'64',null,{}])expect(slideFontSize(value)).toBe(48);});
});
