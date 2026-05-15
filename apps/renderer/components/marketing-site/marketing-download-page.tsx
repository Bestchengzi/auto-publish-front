"use client";

import { AppleIcon, CpuIcon, DownloadIcon, MonitorIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import { listVersionsManifest, type VersionManifestEntry } from "@/lib/api/versions";

type DownloadCard = {
  key: string;
  title: string;
  desc: string;
  format: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

const VERSION_TYPE_ORDER = ["windows", "mac/x64", "mac/arm64"] as const;

function getVersionIcon(type: string): ComponentType<{ className?: string }> {
  if (type === "mac/x64") return CpuIcon;
  if (type === "mac/arm64") return AppleIcon;
  return MonitorIcon;
}

function getVersionFormat(type: string): string {
  if (type === "mac/x64" || type === "mac/arm64") return ".dmg";
  return ".exe";
}

function sortVersions(a: VersionManifestEntry, b: VersionManifestEntry): number {
  const ai = VERSION_TYPE_ORDER.indexOf(a.type as (typeof VERSION_TYPE_ORDER)[number]);
  const bi = VERSION_TYPE_ORDER.indexOf(b.type as (typeof VERSION_TYPE_ORDER)[number]);
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
}

export function MarketingDownloadPage() {
  const t = useTranslations("marketing");
  const [versions, setVersions] = useState<VersionManifestEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listVersionsManifest()
      .then((data) => {
        if (cancelled) return;
        setVersions(data.filter((item) => item.downloadUrl).sort(sortVersions));
        setLoadError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cards: DownloadCard[] = useMemo(
    () =>
      versions.map((version) => ({
        key: version.type,
        title: version.name,
        desc: version.description,
        format: getVersionFormat(version.type),
        url: version.downloadUrl,
        icon: getVersionIcon(version.type),
      })),
    [versions],
  );

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

        {isLoading ? (
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-[138px] animate-pulse rounded-2xl border border-slate-200/90 bg-white/80 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/60"
              />
            ))}
          </div>
        ) : loadError || cards.length === 0 ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-slate-200/90 bg-white/92 p-6 text-center text-sm text-slate-600 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:text-zinc-300">
            {t("downloadUnavailable")}
          </div>
        ) : (
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.key}
                  href={card.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-slate-200/90 bg-white/92 p-5 shadow-sm transition hover:border-blue-400/70 hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:hover:border-blue-400/80 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="size-5 text-slate-900 dark:text-white" />
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{card.title}</span>
                    </div>
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
        )}
      </div>
    </section>
  );
}
