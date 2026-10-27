import {describe,it,expect} from "vitest";
import {defaults,upgradeDefaults} from "../../frontend/src/defaults";
import originalVideos from "../../frontend/src/round2-seed-items-2.json";
import {slideKind,positions,builderColor} from "../../frontend/src/slide-policy";
describe('general slide controls',()=>{
 it('cleans new starter video text without changing the published dataset or later authored text',()=>{const fresh=defaults(),target=originalVideos.find(item=>item.libraryId==='00000000-0000-4000-8000-000000000005'&&item.url.includes('youtu'))!;expect(target.description).not.toBe('');const initialized=fresh.items.find(item=>item.id===target.id)!;expect(initialized).toMatchObject({id:target.id,url:target.url,title:target.title,source:target.source,description:'',summary:''});initialized.description='Later authored text';expect(upgradeDefaults(fresh).items.find(item=>item.id===target.id)?.description).toBe('Later authored text');});
 it('maps legacy types without changing the stored definitions',()=>{for(const type of ['intro','text','divider','closing','discussion'])expect(slideKind({id:'s',type,libraryId:'optional'})).toBe('standard');for(const type of ['library','stretch','recognition','vocabulary'])expect(slideKind({id:'s',type})).toBe('library');for(const type of ['gallery','image','image-text','video','external'])expect(slideKind({id:'s',type})).toBe('media');});
 it('offers all nine distinct positions',()=>{expect(new Set(positions.map(p=>p.value)).size).toBe(9);expect(positions.map(p=>p.value)).toEqual(['top-left','top-center','top-right','middle-left','middle-center','middle-right','bottom-left','bottom-center','bottom-right']);});
 it('accepts arbitrary hex builder colors without changing presentation background',()=>{const slide={id:'s',builderColor:'#1a2B3c',background:'#ffffff'};expect(builderColor(slide)).toBe('#1a2B3c');expect(slide.background).toBe('#ffffff');expect(builderColor({id:'s',builderColor:'red'})).toBeUndefined();});
});
