/**
 * Verifies production ICS feed is reachable (not Vercel Security Checkpoint HTML).
 * Usage: node scripts/calendar-feed-smoke.mjs "https://presh.me/api/booking/calendar?..."
 */
const url = process.argv[2]?.trim();
if (!url) {
  console.error("Usage: node scripts/calendar-feed-smoke.mjs <ics-url>");
  process.exit(1);
}

const res = await fetch(url, {
  headers: { "User-Agent": "CalendarAgent/1.0 (Presh.Me smoke)" },
});
const type = res.headers.get("content-type") ?? "";
const body = await res.text();

if (!res.ok) {
  console.error(`FAIL: HTTP ${res.status}`);
  console.error(body.slice(0, 400));
  process.exit(1);
}

if (type.includes("text/html") || body.includes("Vercel Security Checkpoint")) {
  console.error("FAIL: Got HTML (Vercel bot/challenge page), not text/calendar.");
  console.error("Fix: Vercel Pro WAF bypass for /api/booking/calendar, or disable Attack Mode (Hobby).");
  process.exit(1);
}

if (!body.includes("BEGIN:VCALENDAR") || !body.includes("X-WR-CALNAME")) {
  console.error("FAIL: Response is not a valid booking ICS feed.");
  console.error(body.slice(0, 400));
  process.exit(1);
}

console.log("OK: ICS feed reachable.");
console.log(body.split(/\r?\n/).slice(0, 8).join("\n"));
