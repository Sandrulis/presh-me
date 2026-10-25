/**
 * 1) Extract EN intent keys from marketing-intent-page.tsx fallbacks
 * 2) Patch claim.* in all catalogs
 * 3) Merge intent keys into messages.ts (lv+en) and _catalog/*.json
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const tsPath = path.join(root, "app/components/marketing-intent-page.tsx");
const ts = fs.readFileSync(tsPath, "utf8");

function extractPageCopy() {
  const out = {};
  const block = ts.match(/const PAGE_COPY_FALLBACKS[\s\S]*?= \{([\s\S]*?)\n\};/);
  if (!block) throw new Error("PAGE_COPY_FALLBACKS not found");
  const inner = block[1];
  const pageRe = /"([^"]+)":\s*\{([\s\S]*?)\n  \},/g;
  let m;
  while ((m = pageRe.exec(inner))) {
    const prefix = m[1];
    const body = m[2];
    const fieldRe = /(\w+):\s*"((?:\\.|[^"\\])*)"/g;
    let f;
    while ((f = fieldRe.exec(body))) {
      const field = f[1];
      const value = JSON.parse(`"${f[2]}"`);
      const key =
        field === "metaTitle"
          ? `${prefix}.meta_title`
          : field === "metaDescription"
            ? `${prefix}.meta_description`
            : `${prefix}.${field}`;
      out[key] = value;
    }
  }
  return out;
}

function extractBullets() {
  const out = {};
  const block = ts.match(/const BULLET_FALLBACKS[\s\S]*?= \{([\s\S]*?)\n\};/);
  if (!block) throw new Error("BULLET_FALLBACKS not found");
  const inner = block[1];
  const pageRe = /"([^"]+)":\s*\[([\s\S]*?)\],/g;
  let m;
  while ((m = pageRe.exec(inner))) {
    const prefix = m[1];
    const arr = m[2].match(/"((?:\\.|[^"\\])*)"/g);
    if (!arr || arr.length !== 3) continue;
    const bullets = arr.map((s) => JSON.parse(s));
    out[`${prefix}.bullet1`] = bullets[0];
    out[`${prefix}.bullet2`] = bullets[1];
    out[`${prefix}.bullet3`] = bullets[2];
  }
  return out;
}

const intentEn = {
  ...extractPageCopy(),
  ...extractBullets(),
  "intent.common.back_presh": "← Presh.Me",
  "intent.common.link_in_bio": "Link in bio",
  "intent.for_barbers.nav": "For barbers",
  "intent.for_small_businesses.nav": "For small businesses",
};

const claimByLang = {
  da: {
    "claim.label": "Dit link",
    "claim.placeholder": "navn",
    "claim.submit": "Tag",
    "claim.hint": "3–24 tegn. Små bogstaver, tal og bindestreg.",
    "claim.taken": "Dette link er allerede taget.",
  },
  de: {
    "claim.label": "Dein Link",
    "claim.placeholder": "name",
    "claim.submit": "Nehmen",
    "claim.hint": "3–24 Zeichen. Kleinbuchstaben, Zahlen und Bindestrich.",
    "claim.taken": "Dieser Link ist bereits vergeben.",
  },
  es: {
    "claim.label": "Tu enlace",
    "claim.placeholder": "nombre",
    "claim.submit": "Tomar",
    "claim.hint": "3-24 caracteres. Minúsculas, números y guion.",
    "claim.taken": "Este enlace ya está ocupado.",
  },
  fr: {
    "claim.label": "Ton lien",
    "claim.placeholder": "nom",
    "claim.submit": "Prendre",
    "claim.hint": "3-24 caractères. Minuscules, chiffres et tiret.",
    "claim.taken": "Ce lien est déjà pris.",
  },
  nl: {
    "claim.label": "Jouw link",
    "claim.placeholder": "naam",
    "claim.submit": "Nemen",
    "claim.hint": "3-24 tekens. Kleine letters, cijfers en koppelteken.",
    "claim.taken": "Deze link is al bezet.",
  },
  no: {
    "claim.label": "Din lenke",
    "claim.placeholder": "navn",
    "claim.submit": "Ta",
    "claim.hint": "3–24 tegn. Små bokstaver, tall og bindestrek.",
    "claim.taken": "Denne lenken er allerede tatt.",
  },
  sv: {
    "claim.label": "Din länk",
    "claim.placeholder": "namn",
    "claim.submit": "Ta",
    "claim.hint": "3–24 tecken. Gemener, siffror och bindestreck.",
    "claim.taken": "Den här länken är redan tagen.",
  },
  pl: {
    "claim.label": "Twój link",
    "claim.placeholder": "nazwa",
    "claim.submit": "Zajmij",
    "claim.hint": "3–24 znaki. Małe litery, cyfry i myślnik.",
    "claim.taken": "Ten link jest już zajęty.",
  },
  fi: {
    "claim.label": "Linkkisi",
    "claim.placeholder": "nimi",
    "claim.submit": "Ota",
    "claim.hint": "3–24 merkkiä. Pienet kirjaimet, numerot ja yhdysviiva.",
    "claim.taken": "Tämä linkki on jo varattu.",
  },
  lt: {
    "claim.label": "Tavo nuoroda",
    "claim.placeholder": "vardas",
    "claim.submit": "Pasiimti",
    "claim.hint": "3–24 simboliai. Mažosios raidės, skaičiai ir brūkšnys.",
    "claim.taken": "Ši nuoroda jau užimta.",
  },
  et: {
    "claim.label": "Sinu link",
    "claim.placeholder": "nimi",
    "claim.submit": "Võta",
    "claim.hint": "3–24 märki. Väiketähed, numbrid ja sidekriips.",
    "claim.taken": "See link on juba võetud.",
  },
  it: {
    "claim.label": "Il tuo link",
    "claim.placeholder": "nome",
    "claim.submit": "Prendi",
    "claim.hint": "3-24 caratteri. Minuscole, numeri e trattino.",
    "claim.taken": "Questo link è già occupato.",
  },
  ru: {
    "claim.label": "Твоя ссылка",
    "claim.placeholder": "имя",
    "claim.submit": "Забрать",
    "claim.hint": "3–24 символа. Строчные буквы, цифры и дефис.",
    "claim.taken": "Эта ссылка уже занята.",
  },
};

// Load per-locale intent overlays (optional JSON files)
const localesDir = path.join(root, "scripts/i18n-intent-locales");
const intentByLang = {};
if (fs.existsSync(localesDir)) {
  for (const file of fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"))) {
    const code = file.replace(".json", "");
    intentByLang[code] = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
  }
}

function mergeIntent(lang, catalog) {
  const overlay = intentByLang[lang];
  if (!overlay) return;
  Object.assign(catalog, overlay);
}

function patchMessagesTs(lvExtra, enExtra) {
  const file = path.join(root, "app/lib/i18n/messages.ts");
  let src = fs.readFileSync(file, "utf8");
  const insertAfter = (marker, entries, guardKey) => {
    if (guardKey && src.includes(JSON.stringify(guardKey))) return;
    const idx = src.indexOf(marker);
    if (idx < 0) throw new Error(`marker not found: ${marker}`);
    const lineEnd = src.indexOf("\n", idx);
    const insert = Object.entries(entries)
      .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
      .join("\n");
    src = `${src.slice(0, lineEnd + 1)}${insert}\n${src.slice(lineEnd + 1)}`;
  };
  insertAfter(
    '"claim.taken": "Šis links jau ir aizņemts."',
    lvExtra,
    "Portfolio mājaslapa vienā linkā",
  );
  insertAfter(
    '"claim.taken": "This link is already taken."',
    enExtra,
    "A portfolio website that fits in one link",
  );
  fs.writeFileSync(file, src);
}

// LV translations (intent)
const intentLv = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/i18n-intent-locales/lv.json"), "utf8"),
);

patchMessagesTs(intentLv, intentEn);

const catalogDir = path.join(root, "app/lib/i18n/_catalog");
for (const file of fs.readdirSync(catalogDir).filter((f) => f.endsWith(".json"))) {
  const code = file.replace(".json", "");
  const p = path.join(catalogDir, file);
  const catalog = JSON.parse(fs.readFileSync(p, "utf8"));
  if (claimByLang[code]) Object.assign(catalog, claimByLang[code]);
  if (code === "en") Object.assign(catalog, intentEn);
  mergeIntent(code, catalog);
  if (!intentByLang[code] && code !== "en" && code !== "lv") {
    // keep English fallbacks out of catalog — pages use code fallbacks
  }
  fs.writeFileSync(p, `${JSON.stringify(catalog, null, 2)}\n`);
}

console.log(`intent EN keys: ${Object.keys(intentEn).length}`);
console.log("patched messages.ts + catalogs (claim + intent overlays)");
