import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const localeFolder = path.join(root, "frontend/src/locales");
const catalogs = Object.fromEntries(fs.readdirSync(localeFolder).filter(file => file.endsWith(".json")).map(file => [file, JSON.parse(fs.readFileSync(path.join(localeFolder, file), "utf8"))]));
const catalog = catalogs["es-MX.json"];
const files = fs.readdirSync(path.join(root, "frontend/src")).filter(file => /\.(ts|tsx)$/.test(file)).map(file => "frontend/src/" + file);
files.push("frontend/recovered/index-DwifuW9D.js");
const missing = new Set();
const untranslated = [];
let checked = 0;
function key(text) { checked++; for (const [locale, values] of Object.entries(catalogs)) if (!Object.hasOwn(values, text)) missing.add(`${locale}: ${text}`); }
function literals(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) key(node.text);
  if (ts.isConditionalExpression(node)) { literals(node.whenTrue); literals(node.whenFalse); }
}
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JS);
  const appStart = source.indexOf("function $j(");
  function walk(node) {
    if (ts.isCallExpression(node) && ["t", "translateUI"].includes(node.expression.getText(sf)) && node.arguments[0]) literals(node.arguments[0]);
    // Dictionary values are English source labels, not stored business values.
    if (ts.isVariableDeclaration(node) && ["fieldLabels", "labels"].includes(node.name.getText(sf)) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) if (ts.isPropertyAssignment(property)) literals(property.initializer);
    }
    if (ts.isJsxText(node) && /[A-Za-z]/.test(node.text) && node.text.trim() !== "DOUGLASS TRUCK BODIES") untranslated.push(`${file}: ${node.text.trim()}`);
    if (ts.isPropertyAssignment(node) && file.includes("/recovered/") && node.getStart(sf) > appStart && ["children", "label", "aria-label", "hint", "eyebrow", "placeholder"].includes(node.name.getText(sf).replace(/["']/g, "")) && ts.isStringLiteral(node.initializer)) {
      const value = node.initializer.text;
      if (/[A-Za-z]/.test(value) && !["DTB", "https://", "REPLACE"].includes(value)) untranslated.push(`${file}: ${value}`);
    }
    ts.forEachChild(node, walk);
  }
  walk(sf);
}
for (const [locale, values] of Object.entries(catalogs)) {
 for (const brand of ["Morning Meeting Builder", "Morning Meeting", "BUILDER"]) {
  if (values[brand] !== brand) throw Error(`Keep the app name in English: ${locale}: ${brand}`);
 }
 for (const english of Object.keys(catalog)) {
  const spanish = values[english];
  const placeholders = text => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort().join(",");
  if (!spanish || placeholders(english) !== placeholders(spanish)) throw Error(`Invalid ${locale} translation or placeholders: ${english}`);
}
}
if (missing.size) throw Error("Spanish translations missing:\n" + [...missing].join("\n"));
if (untranslated.length) throw Error("Interface text must use t/translateUI before building:\n" + untranslated.join("\n"));
console.log(`Localization: ${Object.keys(catalog).length} Spanish entries; ${checked} source references checked; all placeholders match.`);
