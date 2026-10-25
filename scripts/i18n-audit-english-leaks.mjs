/**
 * Report catalog keys that still match English (likely untranslated).
 * Run: node scripts/i18n-audit-english-leaks.mjs
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const catalogDir = path.join(root, "app/lib/i18n/_catalog");
const en = JSON.parse(fs.readFileSync(path.join(catalogDir, "en.json"), "utf8"));
const enKeys = Object.keys(en);

const skipPrefixes = [
  "auth.mfa.",
  "errors.mfa",
  "admin.integrations.meta.",
  "admin.settings.date_fmt",
  "admin.settings.time_",
];

function shouldSkip(key) {
  if (key.startsWith("intent.")) return false;
  return skipPrefixes.some((p) => key.startsWith(p));
}

for (const file of fs.readdirSync(catalogDir).filter((f) => f.endsWith(".json") && f !== "en.json")) {
  const code = file.replace(".json", "");
  const cat = JSON.parse(fs.readFileSync(path.join(catalogDir, file), "utf8"));
  const same = enKeys.filter((key) => {
    if (shouldSkip(key)) return false;
    if (!(key in cat)) return false;
    const a = en[key];
    const b = cat[key];
    if (a === b && a.length > 18) return true;
    return false;
  });
  if (same.length) {
    console.log(`\n${code}: ${same.length} keys still EN`);
    console.log(same.slice(0, 12).join(", ") + (same.length > 12 ? ", …" : ""));
  }
}
