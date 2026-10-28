export const DEFAULT_SLIDE_FONT_SIZE=48;
export function slideFontSize(value:unknown):number {
 return typeof value==='number'&&Number.isInteger(value)&&value>=16&&value<=96?value:DEFAULT_SLIDE_FONT_SIZE;
}
