import fs from "fs";
import path from "path";
import { demoMessages } from "./demo-i18n-data.mjs";

const root = path.join(process.cwd(), "app/lib/i18n");
const catalogDir = path.join(root, "_catalog");
const messagesPath = path.join(root, "messages.ts");

function escapeTsString(value) {
  return JSON.stringify(value);
}

function insertIntoMessagesBlock(source, blockLabel, entries) {
  const marker = `\n  ${blockLabel}: {`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${blockLabel} block`);
  const bodyStart = start + marker.length;
  let depth = 1;
  let i = bodyStart;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  const closeIndex = i - 1;
  const body = source.slice(bodyStart, closeIndex);
  const lines = Object.entries(entries)
    .filter(([key]) => !body.includes(`"${key}"`))
    .map(([key, value]) => `    ${escapeTsString(key)}: ${escapeTsString(value)},`)
    .join("\n");
  if (!lines) return source;
  const trimmed = body.replace(/\s*$/, "");
  const needsNewline = !trimmed.endsWith("\n");
  const nextBody = `${trimmed}${needsNewline ? "\n" : ""}${lines}\n  `;
  return source.slice(0, bodyStart) + nextBody + source.slice(closeIndex);
}

function mergeCatalog(lang, entries) {
  const file = path.join(catalogDir, `${lang}.json`);
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [key, value] of Object.entries(entries)) {
    catalog[key] = value;
  }
  fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
}

let source = fs.readFileSync(messagesPath, "utf8");
source = insertIntoMessagesBlock(source, "lv", demoMessages.lv);
source = insertIntoMessagesBlock(source, "en", demoMessages.en);
fs.writeFileSync(messagesPath, source);
console.log("updated messages.ts");

for (const [lang, entries] of Object.entries(demoMessages)) {
  if (lang === "lv") continue;
  mergeCatalog(lang, entries);
  console.log(`updated _catalog/${lang}.json`);
}
