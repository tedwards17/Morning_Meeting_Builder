export const nextKeys = ["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "MediaTrackNext"];
export const previousKeys = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "MediaTrackPrevious"];
export function remoteDirection(event: Pick<KeyboardEvent, "key" | "repeat" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">, keys?: { next?: string; previous?: string }): number {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.key === "Escape") return 0;
  if (keys?.next === event.key) return 1;
  if (keys?.previous === event.key) return -1;
  if (nextKeys.includes(event.key)) return 1;
  if (previousKeys.includes(event.key)) return -1;
  return 0;
}
export function learnableKey(key: string): boolean {
  return Boolean(key) && !["Escape", "Unidentified", "Tab", "Shift", "Control", "Alt", "Meta"].includes(key);
}
