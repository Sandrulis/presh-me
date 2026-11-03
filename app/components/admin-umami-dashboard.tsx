"use client";

import { useEffect, useState } from "react";
import { FeedbackToasts, useNotices } from "@/app/components/feedback-toast";
import { useTranslations } from "@/app/components/translations-provider";
import { loadUmamiReport } from "@/app/lib/integrations/umami/report";
import type { UmamiMetric, UmamiRange, UmamiReport, UmamiReportResult } from "@/app/lib/integrations/umami/share";

const RANGES: UmamiRange[] = ["24h", "7d", "30d", "90d"];
const RANGE_FALLBACK: Record<UmamiRange, string> = {
  "24h": "24 h",
  "7d": "7 dienas",
  "30d": "30 dienas",
  "90d": "90 dienas",
};

export function UmamiDashboard({
  loadReport,
}: {
  loadReport: (range: UmamiRange, timezone: string) => Promise<UmamiReportResult>;
}) {
  const { t, languageCode } = useTranslations();
  const { notices, notify, dismissNotice } = useNotices();
  const [range, setRange] = useState<UmamiRange>("7d");
  const [report, setReport] = useState<UmamiReport | null>(null);
  const [pending, setPending] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let live = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Riga";
    void loadReport(range, timezone).then((result) => {
      if (!live) return;
      setPending(false);
      if (!result.ok) {
        setReport(null);
        setUnavailable(result.error === "umami.unavailable");
        if (result.error !== "umami.unavailable") {
          notify(t("umami.error.load", "Umami statistiku neizdevās ielādēt."), "error");
        }
        return;
      }
      setUnavailable(false);
      setReport(result.report);
    });
    return () => {
      live = false;
    };
  }, [range, loadReport, notify, t]);

  function pickRange(next: UmamiRange) {
    if (next === range || pending) return;
    setPending(true);
    setRange(next);
  }

  const siteName = report?.name || report?.domain || "";

  return (
    <div className="space-y-4">
      <FeedbackToasts notices={notices} onDismiss={dismissNotice} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-zinc-500">
          {siteName
            ? t("umami.lead", "{name} statistika no Umami koplietošanas saites.", {
                name: siteName,
              })
            : t("umami.lead.empty", "Statistika no Umami koplietošanas saites.")}
        </p>
        <div className="flex rounded-lg bg-zinc-100 p-1">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              disabled={pending}
              onClick={() => pickRange(item)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed ${
                item === range ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {t(`umami.range.${item}`, RANGE_FALLBACK[item])}
            </button>
          ))}
        </div>
      </div>
      {pending && !report ? (
        <p className="text-sm text-zinc-500">{t("common.loading", "Ielādē…")}</p>
      ) : null}
      {!pending && !report ? (
        <p className="text-sm text-zinc-500">
          {unavailable
            ? t(
                "umami.unavailable",
                "Umami saite vēl nav saglabāta vai integrācija ir izslēgta.",
              )
            : t("umami.error.load", "Umami statistiku neizdevās ielādēt.")}
        </p>
      ) : null}
      {report ? (
        <div className={pending ? "opacity-60" : ""}>
          <div className="grid gap-3 min-[600px]:grid-cols-3 xl:grid-cols-6">
            <Stat label={t("umami.active", "Šobrīd")} value={formatInteger(report.active)} />
            <Stat
              label={t("umami.visitors", "Apmeklētāji")}
              value={formatInteger(report.visitors)}
              change={changePercent(report.visitors, report.previous.visitors)}
            />
            <Stat
              label={t("umami.visits", "Vizītes")}
              value={formatInteger(report.visits)}
              change={changePercent(report.visits, report.previous.visits)}
            />
            <Stat
              label={t("umami.pageviews", "Skati")}
              value={formatInteger(report.pageviews)}
              change={changePercent(report.pageviews, report.previous.pageviews)}
            />
            <Stat
              label={t("umami.bounce", "Atlēcieni")}
              value={formatPercent(rate(report.bounces, report.visits))}
              change={changePercent(
                rate(report.bounces, report.visits),
                rate(report.previous.bounces, report.previous.visits),
              )}
            />
            <Stat
              label={t("umami.duration", "Vidējais laiks")}
              value={formatVisit(report.totalTime, report.visits)}
              change={changePercent(
                average(report.totalTime, report.visits),
                average(report.previous.totalTime, report.previous.visits),
              )}
            />
          </div>
          <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("umami.chart", "Skati pa periodu")}
            </h2>
            <Chart
              series={report.series}
              hour={range === "24h"}
              lang={languageCode}
              pageviewsLabel={t("umami.pageviews", "Skati")}
              visitsLabel={t("umami.visits", "Vizītes")}
            />
          </section>
          <div className="mt-4 grid gap-4 min-[600px]:grid-cols-2">
            <MetricCard
              title={t("umami.pages", "Lapas")}
              rows={report.pages}
              empty={t("umami.empty", "Šajā periodā nav datu.")}
            />
            <MetricCard
              title={t("umami.referrers", "Avoti")}
              rows={report.referrers}
              empty={t("umami.empty", "Šajā periodā nav datu.")}
            />
            <MetricCard
              title={t("umami.browsers", "Pārlūki")}
              rows={labelRows(report.browsers, titleCase)}
              empty={t("umami.empty", "Šajā periodā nav datu.")}
            />
            <MetricCard
              title={t("umami.os", "Sistēmas")}
              rows={report.systems}
              empty={t("umami.empty", "Šajā periodā nav datu.")}
            />
            <MetricCard
              title={t("umami.devices", "Ierīces")}
              rows={labelRows(report.devices, (label) => deviceLabel(label, t))}
              empty={t("umami.empty", "Šajā periodā nav datu.")}
            />
            <MetricCard
              title={t("umami.countries", "Valstis")}
              rows={labelRows(report.countries, (label) => countryName(label, languageCode))}
              empty={t("umami.empty", "Šajā periodā nav datu.")}
            />
          </div>
          <p className="mt-4 text-sm">
            <a
              href={report.shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-medium text-sky-700 hover:underline"
            >
              {t("umami.open", "Atvērt Umami")} ↗
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("lv-LV").format(Math.round(value));
}

function Stat({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: number | null;
}) {
  const shown =
    change === undefined || change === null ? null : `${change > 0 ? "+" : ""}${change}%`;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">{value}</p>
      {shown ? <p className="mt-1 text-xs text-zinc-500">{shown}</p> : null}
    </div>
  );
}

function Chart({
  series,
  hour,
  lang,
  pageviewsLabel,
  visitsLabel,
}: {
  series: UmamiReport["series"];
  hour: boolean;
  lang: string;
  pageviewsLabel: string;
  visitsLabel: string;
}) {
  const peak = Math.max(1, ...series.map((point) => point.pageviews));
  if (!series.length) return null;
  return (
    <div className="mt-4 flex h-36 items-end gap-1">
      {series.map((point) => (
        <div key={point.at} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
          <div
            className="rounded-sm bg-zinc-900/80"
            style={{ height: `${Math.max(4, Math.round((point.pageviews / peak) * 100))}%` }}
          />
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
            {formatBucket(point.at, hour, lang)} · {pageviewsLabel} {formatInteger(point.pageviews)} ·{" "}
            {visitsLabel} {formatInteger(point.sessions)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: UmamiMetric[];
  empty: string;
}) {
  const peak = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate text-zinc-800">{row.label}</span>
                <span className="mt-1 block h-1.5 rounded-full bg-zinc-100">
                  <span
                    className="block h-1.5 rounded-full bg-zinc-800"
                    style={{ width: `${Math.max(6, Math.round((row.value / peak) * 100))}%` }}
                  />
                </span>
              </span>
              <span className="tabular-nums text-zinc-500">{formatInteger(row.value)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">{empty}</p>
      )}
    </section>
  );
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatVisit(totalSeconds: number, visits: number): string {
  const seconds = Math.round(average(totalSeconds, visits));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function average(total: number, count: number): number {
  if (count <= 0) return 0;
  return total / count;
}

function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

function changePercent(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function formatBucket(value: string, hour: boolean, lang: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (hour) {
    return new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat(lang, { day: "2-digit", month: "2-digit" }).format(date);
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function deviceLabel(value: string, t: (key: string, fallback: string) => string): string {
  if (value === "mobile") return t("umami.device.mobile", "Tālrunis");
  if (value === "laptop") return t("umami.device.laptop", "Klēpjdators");
  if (value === "desktop") return t("umami.device.desktop", "Dators");
  if (value === "tablet") return t("umami.device.tablet", "Planšete");
  return titleCase(value);
}

function countryName(code: string, lang: string): string {
  try {
    return new Intl.DisplayNames(lang, { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function labelRows(rows: UmamiMetric[], label: (value: string) => string): UmamiMetric[] {
  return rows.map((row) => ({ ...row, label: label(row.label) }));
}

export function AdminUmamiDashboard() {
  return <UmamiDashboard loadReport={loadUmamiReport} />;
}
