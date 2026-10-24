"use client";

import { AuthShowcase } from "@/app/components/auth-showcase";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { Logo } from "@/app/components/logo";

export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-[#f6f7fb] lg:h-screen lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] lg:overflow-hidden">
      <div className="flex flex-col overflow-y-auto px-5 py-5 sm:px-8 lg:h-screen lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <LanguageSwitcher variant="menu" />
        </div>
        <div className="flex w-full flex-1 flex-col justify-center py-10 lg:max-w-[22rem] lg:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{kicker}</p>
          <h1 className="mt-3 font-display text-[2.65rem] font-bold leading-[1.02] tracking-[-0.035em]">{title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <AuthShowcase />
    </div>
  );
}
