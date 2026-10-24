/**
 * Upsert all bundled UI + email fallback strings into public.site_translations.
 * Idempotent: merges with existing overlay values (non-empty DB wins per language).
 *
 * Usage: node scripts/seed-site-translations.mjs
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import pg from "pg";
import { createRequire } from "module";

const { Client } = pg;
const require = createRequire(import.meta.url);

function loadEnv(file) {
  const env = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

function getProjectRef(url) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(".supabase.co", "");
}

function connectionString(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const password = env.SUPABASE_DB_PASSWORD;
  if (!url || !password) {
    throw new Error("Missing DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local");
  }
  const projectRef = getProjectRef(url);
  const encodedPassword = encodeURIComponent(password);
  const region = env.SUPABASE_DB_REGION || "eu-west-1";
  return `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
}

function parseQuotedStringMap(text) {
  const map = {};
  const re = /"((?:\\.|[^"\\])+)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(text))) {
    map[JSON.parse(`"${match[1]}"`)] = JSON.parse(`"${match[2]}"`);
  }
  return map;
}

function parseMessagesTs(source) {
  const lvStart = source.indexOf("\n  lv: {");
  const enStart = source.indexOf("\n  en: {");
  if (lvStart < 0 || enStart < 0) throw new Error("Could not parse messages.ts");
  return {
    lv: parseQuotedStringMap(source.slice(lvStart, enStart)),
    en: parseQuotedStringMap(source.slice(enStart)),
  };
}

function loadCatalogs() {
  const root = join(process.cwd(), "app/lib/i18n");
  const { lv, en } = parseMessagesTs(readFileSync(join(root, "messages.ts"), "utf8"));
  const catalogs = { lv, en };
  const catalogDir = join(root, "_catalog");
  for (const file of readdirSync(catalogDir)) {
    if (!file.endsWith(".json") || file === "en.json") continue;
    const code = file.replace(/\.json$/, "");
    catalogs[code] = JSON.parse(readFileSync(join(catalogDir, file), "utf8"));
  }
  return catalogs;
}

function loadEmailFallbacks() {
  // Lightweight parse of FALLBACK_TEMPLATES / BUTTON / FOOTER from templates.ts
  const source = readFileSync(join(process.cwd(), "app/lib/email/templates.ts"), "utf8");
  const packs = {};

  function extractPack(label) {
    const marker = `${label}: {`;
    const start = source.indexOf(marker);
    if (start < 0) return {};
    let i = start + marker.length;
    let depth = 1;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") depth -= 1;
      i += 1;
    }
    return parseQuotedStringMap(source.slice(start, i));
  }

  // FOOTER_FALLBACK is a simple LangPack
  const footerStart = source.indexOf("export const FOOTER_FALLBACK");
  if (footerStart >= 0) {
    const brace = source.indexOf("{", footerStart);
    let i = brace + 1;
    let depth = 1;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") depth -= 1;
      i += 1;
    }
    packs["email.footer_hint"] = parseQuotedStringMap(source.slice(brace, i));
  }

  // Prefer structured defaults from FALLBACK_TEMPLATES via kind keys already in TEMPLATE_KEYS
  const kinds = [
    ["signup", "email.signup"],
    ["password_reset", "email.password_reset"],
    ["email_change", "email.email_change"],
  ];
  for (const [kind, prefix] of kinds) {
    const kindIdx = source.indexOf(`${kind}: {`);
    if (kindIdx < 0) continue;
    const subjectIdx = source.indexOf("subject: {", kindIdx);
    const bodyIdx = source.indexOf("body: {", kindIdx);
    const subjectEnd = (() => {
      let i = subjectIdx + "subject: {".length;
      let depth = 1;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth += 1;
        else if (source[i] === "}") depth -= 1;
        i += 1;
      }
      return i;
    })();
    const bodyEnd = (() => {
      let i = bodyIdx + "body: {".length;
      let depth = 1;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth += 1;
        else if (source[i] === "}") depth -= 1;
        i += 1;
      }
      return i;
    })();
    packs[`${prefix}.subject`] = parseQuotedStringMap(source.slice(subjectIdx, subjectEnd));
    packs[`${prefix}.body`] = parseQuotedStringMap(source.slice(bodyIdx, bodyEnd));
  }

  // BUTTON_FALLBACK per kind
  const buttonStart = source.indexOf("export const BUTTON_FALLBACK");
  if (buttonStart >= 0) {
    for (const [kind, prefix] of kinds) {
      const kindIdx = source.indexOf(`${kind}: {`, buttonStart);
      if (kindIdx < 0 || kindIdx > source.indexOf("export const FOOTER_FALLBACK")) continue;
      let i = kindIdx + `${kind}: {`.length;
      let depth = 1;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth += 1;
        else if (source[i] === "}") depth -= 1;
        i += 1;
      }
      packs[`${prefix}.button`] = parseQuotedStringMap(source.slice(kindIdx, i));
    }
  }

  return packs;
}

async function main() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) throw new Error(".env.local missing");
  const env = loadEnv(envPath);
  const catalogs = loadCatalogs();
  const emailPacks = loadEmailFallbacks();
  const codes = Object.keys(catalogs);
  const keys = new Set([
    ...Object.keys(catalogs.lv),
    ...Object.keys(emailPacks),
  ]);

  const rows = [];
  for (const key of [...keys].sort()) {
    const values = {};
    if (emailPacks[key]) {
      for (const code of codes) {
        values[code] = emailPacks[key][code] || emailPacks[key].en || emailPacks[key].lv || "";
      }
    } else {
      for (const code of codes) {
        values[code] = catalogs[code]?.[key] ?? catalogs.en?.[key] ?? catalogs.lv?.[key] ?? "";
      }
    }
    rows.push({ key, values });
  }

  const client = new Client({
    connectionString: connectionString(env),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  let upserted = 0;
  for (const row of rows) {
    const existing = await client.query(
      `select values from public.site_translations where translation_key = $1`,
      [row.key],
    );
    const prev = existing.rows[0]?.values ?? {};
    const merged = { ...row.values };
    for (const [code, value] of Object.entries(prev)) {
      if (typeof value === "string" && value.trim()) merged[code] = value;
    }
    await client.query(
      `
        insert into public.site_translations (translation_key, values)
        values ($1, $2::jsonb)
        on conflict (translation_key) do update
        set values = excluded.values
      `,
      [row.key, JSON.stringify(merged)],
    );
    upserted += 1;
  }

  await client.end();
  console.log(`Seeded ${upserted} site_translations keys (${codes.length} languages).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
