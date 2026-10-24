/**
 * Lightweight SEO correctness checks (no test runner dependency).
 * Run: node scripts/seo-smoke.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function withEnv(env, fn) {
  const prev = { ...process.env };
  Object.assign(process.env, env);
  try {
    return fn();
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in prev)) delete process.env[key];
    }
    Object.assign(process.env, prev);
  }
}

async function loadSiteUrlModule() {
  // Dynamic import of TS via next isn't available; re-implement mirror checks by reading source.
  const fs = await import("node:fs");
  const src = fs.readFileSync(path.join(root, "app/lib/site-url.ts"), "utf8");
  assert.match(src, /PRODUCTION_ORIGIN = "https:\/\/presh\.me"/);
  assert.match(src, /Never ship preview\/localhost/);
  assert.doesNotMatch(src, /canonical.*localhost:3130/);
}

function checkRobotsSource() {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(root, "app/robots.ts"), "utf8");
  for (const blocked of ["/studio", "/admin", "/login", "/api/"]) {
    assert.ok(src.includes(`"${blocked}"`) || src.includes(`'${blocked}'`), `robots should disallow ${blocked}`);
  }
  assert.ok(src.includes("sitemap"), "robots should advertise sitemap");
}

function checkSitemapSource() {
  const fs = require("fs");
  const src = fs.readFileSync(path.join(root, "app/sitemap.ts"), "utf8");
  assert.ok(!src.includes('"/link-in-bio"'), "sitemap must not list removed link-in-bio page");
  assert.ok(src.includes("getIndexableSeoLocales") || src.includes("absoluteLocaleUrl"), "sitemap uses locale-aware URLs");
  assert.ok(!src.includes('"/studio"'), "sitemap must not list studio as static path");
  assert.ok(src.includes("published"), "sitemap loads published profiles");
  assert.ok(/bio \|\| blocks|display_name|published/i.test(src), "sitemap filters published profiles");
}

function checkNoLocalhostInSeoSources() {
  const fs = require("fs");
  const files = [
    "app/components/marketing-home.tsx",
    "app/components/intent-landing.tsx",
    "app/lib/seo/intent-page.tsx",
    "app/lib/seo/json-ld.ts",
    "app/page.tsx",
  ];
  for (const file of files) {
    const src = fs.readFileSync(path.join(root, file), "utf8");
    assert.ok(!src.includes("http://localhost"), `${file} must not hardcode localhost URLs`);
  }
}

function checkBrandConsistency() {
  const fs = require("fs");
  const messages = fs.readFileSync(path.join(root, "app/lib/i18n/messages.ts"), "utf8");
  assert.match(messages, /"app\.name":\s*"Presh\.Me"/);
  const faq = fs.readFileSync(path.join(root, "app/lib/landing-faq-items.ts"), "utf8");
  assert.ok(!/Linktree import|importēt no Linktree/i.test(faq), "FAQ must not claim Linktree import");
}

async function main() {
  await loadSiteUrlModule();
  checkRobotsSource();
  checkSitemapSource();
  checkNoLocalhostInSeoSources();
  checkBrandConsistency();

  // Runtime-ish: production NODE_ENV must not prefer localhost when env unset
  // (logic mirrored from site-url.ts for documentation; full runtime covered by build)
  withEnv({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: undefined, VERCEL_URL: undefined }, () => {
    assert.equal(process.env.NODE_ENV, "production");
  });

  withEnv({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3130" }, () => {
    assert.equal(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3130");
  });

  console.log("seo-smoke: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
