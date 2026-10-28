const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;
const MS_MONTH = 30 * MS_DAY;
const MS_YEAR = 365 * MS_DAY;

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

export function formatTrialExpiredMessage(t: TranslateFn, trialEndMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - trialEndMs);
  let ago: string;

  if (diff < MS_DAY) {
    const hours = Math.max(1, Math.floor(diff / MS_HOUR));
    ago =
      hours === 1
        ? t("studio.trial.ago.one_hour", "pirms 1 stundas")
        : t("studio.trial.ago.hours", "pirms {count} stundām", { count: hours });
  } else if (diff < MS_MONTH) {
    const days = Math.max(1, Math.floor(diff / MS_DAY));
    ago =
      days === 1
        ? t("studio.trial.ago.one_day", "pirms 1 dienas")
        : t("studio.trial.ago.days", "pirms {count} dienām", { count: days });
  } else if (diff < MS_YEAR) {
    const months = Math.max(1, Math.floor(diff / MS_MONTH));
    ago =
      months === 1
        ? t("studio.trial.ago.one_month", "pirms 1 mēneša")
        : t("studio.trial.ago.months", "pirms {count} mēnešiem", { count: months });
  } else {
    const years = Math.max(1, Math.floor(diff / MS_YEAR));
    ago =
      years === 1
        ? t("studio.trial.ago.one_year", "pirms 1 gada")
        : t("studio.trial.ago.years", "pirms {count} gadiem", { count: years });
  }

  return t("studio.trial.expired", "Izmēģinājuma periods beidzies ({ago})", { ago });
}
