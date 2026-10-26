import type {Row} from "./types";
export type ContentCategory = "text" | "media" | "link";
export function youtubeId(value: string): string | null {
  try {
    const u=new URL(value), host=u.hostname.toLowerCase();let id="";
    if(host==="youtu.be")id=u.pathname.split("/")[1]??"";
    else if(["youtube.com","www.youtube.com","m.youtube.com"].includes(host))id=u.pathname==="/watch"?u.searchParams.get("v")??"":/^\/(embed|shorts|live)\//.test(u.pathname)?u.pathname.split("/")[2]??"":"";
    return /^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
  }catch{return null;}
}
export function contentCategory(item:Row):ContentCategory {
  if(item.assetId || ["image","image-text","video"].includes(item.type))return "media";
  if(item.url || ["link","external-video"].includes(item.type))return "link";
  return "text";
}
export function categoryLabel(category:ContentCategory):string {return category==="text"?"Text":category==="media"?"Image/Video":"Link";}
export function playableContent(item:Row):Row {return contentCategory(item)==="link"?{...item,type:youtubeId(item.url??"")?"external-video":"link"}:item;}
export function sharedWith(item:Row,location:string):boolean {return !item.locations?.length || item.locations.includes(location);}
export function matchesSlideContent(slide: Row, item: Row): boolean {
  if (item.archived || (slide.libraryId && item.libraryId !== slide.libraryId)) return false;
  const kind=contentCategory(item);
  if (slide.type==="gallery")return kind==="media";
  if (["image", "image-text"].includes(slide.type)) return kind==="media"&&item.type!=="video";
  if (slide.type === "video") return item.type === "video";
  if (slide.type === "external") return kind==="link";
  if (slide.type === "stretch") return !!slide.libraryId || item.type === "stretch";
  if (["vocabulary", "recognition"].includes(slide.type)) return kind==="text";
  return true;
}
