import type {Row} from "./types";

// A connected movement library may contain instructions, images or videos.
// Timer-only custom slides without a library still match explicit Stretch items only.
export function matchesSlideContent(slide: Row, item: Row): boolean {
  if (item.archived || (slide.libraryId && item.libraryId !== slide.libraryId)) return false;
  if (["gallery", "image", "image-text"].includes(slide.type)) return item.type === "image";
  if (slide.type === "video") return item.type === "video";
  if (slide.type === "external") return ["link", "external-video"].includes(item.type);
  if (slide.type === "stretch") return !!slide.libraryId || item.type === "stretch";
  if (["vocabulary", "recognition"].includes(slide.type)) return item.type === slide.type;
  return true;
}
