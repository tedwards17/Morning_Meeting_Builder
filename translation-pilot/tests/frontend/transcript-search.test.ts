import {expect, test} from "vitest";
import {transcriptSearchParts} from "../../frontend/src/transcript-search";

test("highlights all case-insensitive occurrences and reconstructs the original English and Spanish text", () => {
  const text = "El pasillo está libre. EL PASILLO sigue libre.";
  const parts = transcriptSearchParts(text, " el pasillo ");
  expect(parts.filter(part => part.match).map(part => part.text)).toEqual(["El pasillo", "EL PASILLO"]);
  expect(parts.map(part => part.text).join("")).toBe(text);
});
test("treats regular expression punctuation and HTML as literal text", () => {
  const text = "Check [a+b] and [a+b]. <img src=x> is text.";
  expect(transcriptSearchParts(text, "[a+b]").filter(part => part.match)).toHaveLength(2);
  expect(transcriptSearchParts(text, "<img src=x>").filter(part => part.match)).toEqual([{text:"<img src=x>", match:true}]);
  expect(transcriptSearchParts(text, "a.*b").some(part => part.match)).toBe(false);
});
test("empty and unmatched searches leave all text visible", () => {
  const text = "Keep the aisle clear.";
  expect(transcriptSearchParts(text, " ")).toEqual([{text, match:false}]);
  expect(transcriptSearchParts(text, "mounting")).toEqual([{text, match:false}]);
});
