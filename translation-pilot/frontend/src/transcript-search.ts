export type SearchPart = {text: string; match: boolean};

// Literal, case-insensitive matches. React renders each part as text, never HTML.
export function transcriptSearchParts(text: string, query: string): SearchPart[] {
  const needle = query.trim();
  if (!needle) return [{text, match: false}];
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escaped, "giu");
  const parts: SearchPart[] = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) parts.push({text: text.slice(end, match.index), match: false});
    parts.push({text: match[0], match: true});
    end = match.index + match[0].length;
  }
  if (end < text.length) parts.push({text: text.slice(end), match: false});
  return parts.length ? parts : [{text, match: false}];
}
