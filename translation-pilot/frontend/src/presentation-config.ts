type PublicConfig = { translationEnabled?: boolean; captionGap?: number };
declare global { interface Window { MMB_CONFIG?: PublicConfig } }
export const translationEnabled = window.MMB_CONFIG?.translationEnabled !== false;
const gap = Number(window.MMB_CONFIG?.captionGap ?? 6);
export const captionGap = Number.isFinite(gap) ? Math.min(32, Math.max(0, gap)) : 6;
export const fullscreenFallback = "Fullscreen is unavailable in this browser. Try your browser’s fullscreen command or Add to Home Screen and open the installed app. Browser controls may remain visible.";
export async function toggleFullscreen(): Promise<void> {
  if (document.fullscreenElement) { await document.exitFullscreen(); return; }
  if (!document.documentElement.requestFullscreen || !document.fullscreenEnabled)
    throw new Error(fullscreenFallback);
  try { await document.documentElement.requestFullscreen(); }
  catch { throw new Error(fullscreenFallback); }
}
