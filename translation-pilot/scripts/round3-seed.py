"""Update the shipped Round 3 defaults without changing user-created rows."""
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import parse_qs, urlsplit, urlunsplit

root = Path(__file__).resolve().parents[1] / "frontend/src"
meta_file = root / "round2-seed-meta.json"
meta = json.loads(meta_file.read_text())
slides = meta["template"]["slides"]
slides[:] = [slide for slide in slides if not slide["id"].endswith("1003")]
by_id = {slide["id"][-4:]: slide for slide in slides}
by_id["1002"].update(title="Morning movement", text="", notes="", count=1)
by_id["1004"].update(title="Safety Moment", text="", notes="")
by_id["1005"].update(title="Safety comments", text="Let’s hear 3 comments about today’s safety topic.")
by_id["1007"].update(title="Lean Learning", text="")
by_id["1008"].update(type="gallery", layout="full-media", text="", notes="",
                      contentIds=[], selection="manual", count=12)
by_id["1008"].pop("libraryId", None)
by_id["1012"].update(text="")
if "1013" not in by_id:
    lean = dict(by_id["1007"])
    lean.update(id="00000000-0000-4000-8000-000000001013", title="Lean learning comments",
                type="discussion", text="Let’s hear 3 comments about today’s lean learning topic.",
                libraryId=None, contentIds=[], count=1)
    lean.pop("libraryId")
    slides.insert(slides.index(by_id["1007"]) + 1, lean)
slides.remove(by_id["1011"])
slides.append(by_id["1011"])
meta_file.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")

items = []
for number in range(1, 5):
    items.extend(json.loads((root / f"round2-seed-items-{number}.json").read_text()))
groups = defaultdict(list)
for item in items:
    if item["libraryId"].endswith("0005") and item["type"] == "external-video":
        url = urlsplit(item.get("url", ""))
        query = parse_qs(url.query)
        youtube_id = (query.get("v") or [url.path.strip("/") if "youtu.be" in url.netloc else ""])[0]
        if youtube_id:
            groups[youtube_id].append(item)

map_file = root / "round3-dedup-map.json"
removed = json.loads(map_file.read_text()) if map_file.exists() else {}
for video_id, group in groups.items():
    if len(group) < 2:
        continue
    primary = group[0]
    # Keep the first established ID so existing references survive migration.
    segments = []
    for entry in group:
        description = entry.get("description", "")
        match = re.search(r"Video segment:\s*([^\n]+)", description)
        if match and match.group(1) not in segments:
            segments.append(match.group(1))
        if entry is not primary:
            removed[entry["id"]] = primary["id"]
    description = re.sub(r"\n?The pilot player does not automatically stop at the listed end time\.", "", primary.get("description", ""))
    description = re.sub(r"Video segment:[^\n]*", "", description).strip()
    primary["description"] = (description + ("\n" if description else "") +
                              ("Recommended time ranges: " + "; ".join(segments) if segments else "")).strip()
    parsed = urlsplit(primary["url"])
    primary["url"] = urlunsplit((parsed.scheme, parsed.netloc, parsed.path, f"v={video_id}", ""))

for item in items:
    item["description"] = re.sub(r"\n?The pilot player does not automatically stop at the listed end time\.", "", item.get("description", "")).strip()
    if item["libraryId"].endswith("0008"):
        item["title"] = re.sub(r"^Quote of the day\s*#?\d+\s*(?:—\s*[^\n]*)?$", "", item["title"]).strip() or item["description"].split("\n")[0][:95]

items = [item for item in items if item["id"] not in removed]
for number in range(1, 5):
    part = items[(number - 1) * 400:number * 400]
    (root / f"round2-seed-items-{number}.json").write_text(json.dumps(part, ensure_ascii=False, separators=(",", ":")) + "\n")
map_file.write_text(json.dumps(removed, separators=(",", ":")) + "\n")
print(f"Retained {len(items)} content items, removed {len(removed)} duplicate lean video rows")
