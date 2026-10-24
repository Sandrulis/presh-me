"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import {
  isAdminListsComplete,
  loadMoreAdminLists,
  subscribeStore,
} from "@/app/lib/store";

export function AdminLoadMore({
  onError,
}: {
  onError?: (message: string) => void;
}) {
  const { t } = useTranslations();
  const complete = useSyncExternalStore(subscribeStore, isAdminListsComplete, () => true);
  const [pending, setPending] = useState(false);

  if (complete) return null;

  return (
    <div className="flex justify-center pt-1">
      <button
        type="button"
        className="btn-line"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void loadMoreAdminLists().then((result) => {
            setPending(false);
            if (!result.ok) onError?.(result.message);
          });
        }}
      >
        {pending
          ? t("admin.load_more.pending", "Ielādē...")
          : t("admin.load_more", "Rādīt vairāk")}
      </button>
    </div>
  );
}
