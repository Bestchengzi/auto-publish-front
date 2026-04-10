"use client";

import { AppleIcon, CpuIcon, DownloadIcon, MonitorIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const RELEASES_URL = "https://gitee.com/beeize_enterprise/auto-publish-front/releases";

type DownloadCard = {
  key: "windows" | "intel" | "apple";
  title: string;
  desc: string;
  format: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function MarketingDownloadPage() {
  const t = useTranslations("marketing");

  const cards: DownloadCard[] = [
    {
      key: "windows",
      title: t("downloadWindows"),
      desc: t("downloadWindowsDesc"),
      format: ".exe",
      icon: MonitorIcon,
    },
    {
      key: "intel",
      title: t("downloadMacIntel"),
      desc: t("downloadMacIntelDesc"),
      format: ".dmg / .zip (x64)",
      icon: CpuIcon,
    },
    {
      key: "apple",
      title: t("downloadMacApple"),
      desc: t("downloadMacAppleDesc"),
      format: ".dmg / .zip (arm64)",
      icon: AppleIcon,
    },
  ];

  return (
    <section className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-[#f9fcff] via-[#fcfdff] to-[#fefefe] py-20 dark:border-zinc-800/80 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 sm:py-24 lg:min-h-[600px] lg:py-32">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(78% 62% at 50% 8%, rgba(59,130,246,0.045), rgba(59,130,246,0) 68%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(75%_60%_at_50%_10%,rgba(34,211,238,0.1),rgba(34,211,238,0)_70%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/72 via-white/24 to-transparent dark:from-zinc-950 dark:via-zinc-950/45 dark:to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">{t("downloadPageTitle")}</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-zinc-300">{t("downloadPageSubtitle")}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.key}
                href={RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-slate-200/90 bg-white/92 p-5 shadow-sm transition hover:border-blue-400/70 hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:hover:border-blue-400/80 dark:hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-slate-900 dark:text-white" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{card.title}</span>
                  </div>
                  <span className="rounded bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                    BETA
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-zinc-300">{card.desc}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-zinc-400">{card.format}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-blue-700 group-hover:text-blue-600 dark:text-blue-300 dark:group-hover:text-blue-200">
                    {t("downloadNow")}
                    <DownloadIcon className="size-4" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
