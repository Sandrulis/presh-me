/**
 * Fill ONLY missing _catalog keys via MyMemory (EN → target).
 */
import fs from "fs";
import path from "path";

const catalogDir = path.join(process.cwd(), "app/lib/i18n/_catalog");
const ALL = [
  ["fr", "fr"], ["es", "es"], ["nl", "nl"], ["da", "da"], ["no", "no"],
  ["fi", "fi"], ["pl", "pl"], ["lt", "lt"], ["et", "et"], ["it", "it"], ["sv", "sv"],
];

function placeholders(value) {
  return [...String(value).matchAll(/\{[A-Za-z0-9_]+\}/g)].map((m) => m[0]).sort();
}

function shouldKeep(text) {
  if (!text) return true;
  if (/^(YYYY|DD|MM)/.test(text)) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^(pk_|….|@|Europe\/)/.test(text)) return true;
  return ["Cloudflare","Turnstile","Google","OAuth","Resend","Umami","Sentry","Stripe","Spotify","YouTube","Instagram","FAQ","DSN","API Key","Client ID","Client Secret","Logo","Favicon","Tagline","Bio","Site Key","Secret Key","Publishable Key","Key"].includes(text);
}

async function translateOne(text, to) {
  if (shouldKeep(text)) return text;
  const protectedText = text.replace(/\{([A-Za-z0-9_]+)\}/g, "[[$1]]");
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(protectedText)}&langpair=en|${to}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  let out = String(data?.responseData?.translatedText ?? "");
  if (!out || /MYMEMORY WARNING/i.test(out)) throw new Error(out || "empty");
  out = out.replace(/\[\[\s*([A-Za-z0-9_]+)\s*\]\]/g, "{$1}");
  if (placeholders(text).join(",") !== placeholders(out).join(",")) {
    const enPh = [...text.matchAll(/\{[A-Za-z0-9_]+\}/g)].map((m) => m[0]);
    let i = 0;
    out = out.replace(/\{[^}]+\}/g, () => enPh[i++] ?? "");
    if (placeholders(out).join(",") !== placeholders(text).join(",")) return text;
  }
  return out;
}

async function main() {
  const only = process.argv.slice(2);
  const langs = only.length ? ALL.filter(([l]) => only.includes(l)) : ALL;
  const en = JSON.parse(fs.readFileSync(path.join(catalogDir, "en.json"), "utf8"));
  delete en["landing.faq.q3"];
  delete en["landing.faq.a3"];

  for (const [lang, code] of langs) {
    const file = path.join(catalogDir, `${lang}.json`);
    const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
    delete catalog["landing.faq.q3"];
    delete catalog["landing.faq.a3"];
    const missing = Object.keys(en).filter((k) => !(k in catalog));
    console.log(lang, "missing", missing.length);
    let i = 0;
    for (const key of missing) {
      i += 1;
      try {
        catalog[key] = await translateOne(en[key], code);
      } catch (err) {
        console.error(lang, key, err.message);
        await new Promise((r) => setTimeout(r, 2000));
        try {
          catalog[key] = await translateOne(en[key], code);
        } catch (e2) {
          console.error(lang, key, "retry fail", e2.message);
          // leave missing — do not write English
          continue;
        }
      }
      if (i % 15 === 0) {
        fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
        console.log(lang, i, "/", missing.length);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log(lang, "done", Object.keys(catalog).length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
