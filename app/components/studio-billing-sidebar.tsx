"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StudioBillingLoadingBlock } from "@/app/components/studio-billing-loading-block";
import { StudioPlanPickerDrawer } from "@/app/components/studio-plan-picker-drawer";
import { StudioBillingPlanButton } from "@/app/components/studio-billing-plan-button";
import { StudioSubscriptionPanel } from "@/app/components/studio-subscription-panel";
import { StudioTrialMeter } from "@/app/components/studio-trial-meter";
import { useTranslations } from "@/app/components/translations-provider";
import { computeTrialProgress } from "@/app/lib/trial/compute-trial-progress";
import { useBillingStatus } from "@/app/lib/billing/use-billing-status";
import { getSiteSettings, refreshSiteAdmin, subscribeSiteAdmin } from "@/app/lib/site-admin/store";
import { useSyncExternalStore } from "react";

type Props = {
  trialStartedAt: string;
  trailModuleEnabled: boolean;
  paidPlansModuleEnabled: boolean;
};

export function StudioBillingSidebar({
  trialStartedAt,
  trailModuleEnabled,
  paidPlansModuleEnabled,
}: Props) {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const billingQuery = searchParams.get("billing");
  const settings = useSyncExternalStore(subscribeSiteAdmin, getSiteSettings, getSiteSettings);
  const refreshKey = billingQuery ?? "";
  const { status, loading, reload } = useBillingStatus({ refreshKey });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);

  useEffect(() => {
    void refreshSiteAdmin();
  }, []);

  useEffect(() => {
    if (billingQuery !== "success") return;
    setCheckoutPending(true);
    void (async () => {
      try {
        await fetch("/api/billing/sync", { method: "POST", credentials: "same-origin" });
        await reload();
      } finally {
        setCheckoutPending(false);
      }
    })();
  }, [billingQuery, reload]);

  const activating = checkoutPending || (billingQuery === "success" && loading);
  const billingStatusPending = paidPlansModuleEnabled && loading;

  const showSubscription =
    !activating &&
    !billingStatusPending &&
    paidPlansModuleEnabled &&
    status.paidPlansEnabled &&
    (status.hasActiveAccess || status.phase === "canceling" || status.phase === "ended");

  if (activating || billingStatusPending) {
    const header = activating
      ? paidPlansModuleEnabled && status.paidPlansEnabled
        ? "subscription"
        : "trial"
      : "none";
    const label = activating ? "studio.subscription.activating" : "common.loading";
    return (
      <>
        <StudioBillingLoadingBlock header={header} label={label} />
        <StudioPlanPickerDrawer open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
    );
  }

  if (showSubscription) {
    return (
      <>
        <StudioSubscriptionPanel
          status={status}
          onChoosePlan={() => setPickerOpen(true)}
          onChanged={() => void reload()}
        />
        <StudioPlanPickerDrawer open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
    );
  }

  if (!trailModuleEnabled || !trialStartedAt) return null;

  const progress = computeTrialProgress(trialStartedAt, settings.trialPeriodDays);
  const trialExpired = progress?.expired === true;
  const showUpgradeLink = paidPlansModuleEnabled && status.paidPlansEnabled && trialExpired;

  return (
    <>
      <StudioTrialMeter trialStartedAt={trialStartedAt} />
      {showUpgradeLink ? (
        <StudioBillingPlanButton onClick={() => setPickerOpen(true)}>
          {t("studio.subscription.choose_plan_link", "Izvēlies abonementa plānu")}
        </StudioBillingPlanButton>
      ) : null}
      <StudioPlanPickerDrawer open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
