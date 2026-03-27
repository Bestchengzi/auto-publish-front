import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ImagesIcon,
  LightbulbIcon,
  ListIcon,
  PenSquareIcon,
  UserRoundIcon,
} from "lucide-react";

import { LocaleToggle } from "@/components/locale-toggle";
import { StyleToggle } from "@/components/style-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { RecentCreations } from "@/components/recent-creations/recent-creations";
import { Separator } from "@/components/ui/separator";

function BeeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="bee-body" x1="12" y1="22" x2="52" y2="42">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="bee-wing" x1="18" y1="16" x2="34" y2="32">
          <stop stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>

      <path
        d="M20 22c-5-7 1-14 9-12 6 2 7 9 2 13-4 3-8 2-11-1Z"
        fill="url(#bee-wing)"
        stroke="#A5B4FC"
        strokeWidth="1.5"
      />
      <path
        d="M34 24c-2-8 6-14 13-10 6 4 4 12-2 14-5 1-9-1-11-4Z"
        fill="url(#bee-wing)"
        stroke="#A5B4FC"
        strokeWidth="1.5"
        opacity="0.95"
      />

      <ellipse cx="34" cy="38" rx="18" ry="14" fill="url(#bee-body)" />
      <path
        d="M24 30c2 3 4 6 4 16M32 26c1 5 1 8 1 24M40 26c-1 6-1 11 1 24M48 30c-2 4-4 7-4 16"
        stroke="#111827"
        strokeOpacity="0.35"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      <circle cx="16.5" cy="36.5" r="6.5" fill="#F59E0B" />
      <circle cx="14.8" cy="35.5" r="1.1" fill="#111827" />
      <path
        d="M12 30c-2-3-1-6 2-7M18 30c1-4 4-6 7-5"
        stroke="#111827"
        strokeOpacity="0.5"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path d="M54 38l6 3-6 3c1-2 1-4 0-6Z" fill="#111827" opacity="0.6" />
    </svg>
  );
}

type ActiveKey =
  | "overview"
  | "account"
  | "assetLibrary"
  | "worksLibrary"
  | "topicCenter"
  | "creationCenter";

function NavItem({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary/10 px-2 text-sm font-medium text-primary"
          : "flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
      }
    >
      {icon}
      {label}
    </Link>
  );
}

export async function AppShell({
  locale,
  activeKey,
  children,
}: {
  locale: string;
  activeKey: ActiveKey;
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-muted/40 dark:bg-muted/40">
      <div className="flex min-h-0 flex-1">
        <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-muted/30 text-foreground dark:bg-muted/20">
          <div className="flex h-14 items-center px-4">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl bg-muted ring-1 ring-border">
                <BeeLogo className="size-6 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" />
              </div>
              <div className="leading-tight">
                <div className="text-lg font-semibold">{t("app.name")}</div>
              </div>
            </div>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-3 py-4">
            <div className="space-y-1">
              <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {t("sidebar.groups.ai")}
              </div>
              <NavItem
                href={`/${locale}/creation-center/new`}
                active={activeKey === "creationCenter"}
                icon={<PenSquareIcon className="size-4" />}
                label={t("sidebar.items.creationCenter")}
              />
              <NavItem
                href={`/${locale}/topic-center`}
                active={activeKey === "topicCenter"}
                icon={<LightbulbIcon className="size-4" />}
                label={t("sidebar.items.topicCenter")}
              />
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {t("sidebar.groups.works")}
              </div>
              <NavItem
                href={`/${locale}/works-library`}
                active={activeKey === "worksLibrary"}
                icon={<ListIcon className="size-4" />}
                label={t("sidebar.items.worksLibrary")}
              />
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {t("sidebar.groups.assets")}
              </div>
              <NavItem
                href={`/${locale}/account`}
                active={activeKey === "account"}
                icon={<UserRoundIcon className="size-4" />}
                label={t("sidebar.items.account")}
              />
              <NavItem
                href={`/${locale}/asset-library`}
                active={activeKey === "assetLibrary"}
                icon={<ImagesIcon className="size-4" />}
                label={t("sidebar.items.assetLibrary")}
              />
            </div>

            <div className="flex flex-1 min-h-0 flex-col pt-0">
              <Separator className="mt-0 mb-4" />
              <div className="flex-1 min-h-0">
                <RecentCreations locale={locale} />
              </div>
            </div>
          </nav>

          <div className="mt-auto">
            <Separator />
            <div className="p-3 flex items-center gap-2">
              <StyleToggle
                label={t("nav.style.label")}
                neutralLabel={t("nav.style.neutral")}
                blueLabel={t("nav.style.blue")}
                violetLabel={t("nav.style.violet")}
              />
              <LocaleToggle
                label={t("nav.locale.label")}
                zhLabel={t("nav.locale.zh")}
                enLabel={t("nav.locale.en")}
              />
              <ThemeToggle
                label={t("nav.theme.label")}
                lightLabel={t("nav.theme.light")}
                darkLabel={t("nav.theme.dark")}
                systemLabel={t("nav.theme.system")}
              />
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="h-full min-h-0 w-full overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
