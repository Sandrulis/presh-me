import fs from "fs";
import path from "path";

const catalogDir = path.join(process.cwd(), "app/lib/i18n/_catalog");
const ALL = [
  ["it", "it"], ["nl", "nl"], ["da", "da"], ["no", "no"],
  ["fi", "fi"], ["pl", "pl"], ["lt", "lt"], ["et", "et"], ["sv", "sv"],
];

function placeholders(value) {
  return [...String(value).matchAll(/\{[A-Za-z0-9_]+\}/g)].map((m) => m[0]).sort();
}

function shouldKeep(text) {
  if (!text) return true;
  if (/^(YYYY|DD|MM|AAAA)/.test(text)) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^(pk_|….|@|Europe\/)/.test(text)) return true;
  const keep = new Set(["Cloudflare","Turnstile","Google","OAuth","Resend","Umami","Sentry","Stripe","Spotify","YouTube","Instagram","FAQ","DSN","API Key","Client ID","Client Secret","Logo","Favicon","Tagline","Bio","Site Key","Secret Key","Publishable Key","Key","Google OAuth","Google sign-in"]);
  return keep.has(text);
}

async function translateOne(text, to) {
  if (shouldKeep(text)) return text;
  const protectedText = text.replace(/\{([A-Za-z0-9_]+)\}/g, "[[$1]]");
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", to);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", protectedText);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  let out = "";
  if (Array.isArray(data?.[0])) {
    out = data[0].map((part) => part?.[0] ?? "").join("");
  }
  if (!out) throw new Error("empty");
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
      let ok = false;
      for (let attempt = 0; attempt < 4 && !ok; attempt++) {
        try {
          catalog[key] = await translateOne(en[key], code);
          ok = true;
        } catch (err) {
          console.error(lang, key, attempt, err.message);
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
      if (!ok) {
        console.error(lang, key, "SKIPPED");
        continue;
      }
      if (i % 20 === 0) {
        fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
        console.log(lang, i, "/", missing.length);
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log(lang, "done", Object.keys(catalog).length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
