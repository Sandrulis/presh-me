import { PageLanguageScope } from "@/app/components/page-language-scope";
import { PageView } from "@/app/components/page-view";
import type { PageContent } from "@/app/lib/types";

export function PhoneFrame({ page }: { page: PageContent }) {
  const handle = page.handle.trim();
  const host = handle ? `presh.me/${handle}` : "presh.me";

  return (
    <div className="mx-auto w-full max-w-[390px] rounded-[36px] bg-[#16181d] p-2.5 shadow-[0_24px_50px_rgba(0,0,0,0.28)]">
      <div className="flex h-[min(700px,78vh)] flex-col overflow-hidden rounded-[26px] bg-[#f4f5f7]">
        <div
          className="shrink-0 px-3.5 pb-2.5 pt-2.5 text-[#1c1c1e]"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          aria-hidden="true"
        >
          <div className="flex items-center justify-between px-1 text-[12px] font-semibold leading-none">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </span>
          </div>
          <div className="relative mt-2.5 flex h-9 items-center rounded-full bg-white px-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/10">
            <LockIcon />
            <p className="min-w-0 flex-1 truncate px-2 text-center text-[13px] leading-none tracking-[-0.01em]">
              <span className="text-[#8e8e93]">https://</span>
              <span className="font-medium">{host}</span>
            </p>
            <ReloadIcon />
          </div>
        </div>
        <div
          className="studio-phone-scroll min-h-0 flex-1 overflow-y-auto bg-white"
          style={{ containerType: "size" }}
        >
          <PageLanguageScope languageCode={page.publicLanguageCode}>
            <PageView page={page} mode="preview" framed />
          </PageLanguageScope>
        </div>
        <div className="flex shrink-0 justify-center bg-[#f4f5f7] py-2" aria-hidden="true">
          <span className="h-[5px] w-28 rounded-full bg-[#1c1c1e]" />
        </div>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#3a3a3c]">
      <path
        fill="currentColor"
        d="M8 1.4a3.1 3.1 0 0 0-3.1 3.1V6H4.2A1.2 1.2 0 0 0 3 7.2v6.1c0 .66.54 1.2 1.2 1.2h7.6c.66 0 1.2-.54 1.2-1.2V7.2c0-.66-.54-1.2-1.2-1.2h-.7V4.5A3.1 3.1 0 0 0 8 1.4Zm-1.7 4.6V4.5a1.7 1.7 0 1 1 3.4 0V6H6.3Z"
      />
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#3a3a3c]">
      <path
        d="M13.2 8a5.2 5.2 0 1 1-1.4-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12.2 2.6v2.5H9.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="7" width="3" height="5" rx="0.6" />
      <rect x="4.5" y="5" width="3" height="7" rx="0.6" />
      <rect x="9" y="2.5" width="3" height="9.5" rx="0.6" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.6" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
      <path d="M1 4.2C3.6 1.8 11.4 1.8 14 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.2 6.6c1.9-1.6 6.7-1.6 8.6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5.5 9c.9-.8 3.1-.8 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
      <rect x="0.7" y="0.7" width="21" height="10.6" rx="2.4" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2.2" y="2.2" width="16" height="7.6" rx="1.2" fill="currentColor" />
      <path d="M23 4.2v3.6c.7-.3 1.2-1 1.2-1.8S23.7 4.5 23 4.2Z" fill="currentColor" />
    </svg>
  );
}
