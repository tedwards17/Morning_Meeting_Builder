export const DEFAULT_SLIDE_FONT_SIZE=48;
export function slideFontSize(value:unknown):number {
 return typeof value==='number'&&Number.isInteger(value)&&value>=16&&value<=96?value:DEFAULT_SLIDE_FONT_SIZE;
}

export function slideFonts(theme:{fontSize?:unknown;titleFontSize?:unknown;textFontSize?:unknown;[key:string]:unknown}={}) {
 const legacy=slideFontSize(theme.fontSize);
 return {title:slideFontSize(theme.titleFontSize??legacy),text:slideFontSize(theme.textFontSize??legacy)};
}
