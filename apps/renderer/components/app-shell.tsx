"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ImagesIcon,
  LightbulbIcon,
  ListIcon,
  PenSquareIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react";

import { AppShellProtectedNavItem } from "@/components/app-shell-protected-nav-item";
import { AppShellSidebarFooter } from "@/components/app-shell-sidebar-footer";
import { RecentCreations } from "@/components/recent-creations/recent-creations";
import { Separator } from "@/components/ui/separator";

type ActiveKey =
  | "account"
  | "assetLibrary"
  | "worksLibrary"
  | "topicCenter"
  | "creationCenter"
  | "autoPublish"
  | "earnPoints";

function resolveActiveKey(pathname: string | null, locale: string): ActiveKey {
  if (!pathname) return "creationCenter";
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const prefix = `/${locale}/`;
  if (!normalized.startsWith(prefix)) return "creationCenter";
  const rest = normalized.slice(prefix.length);
  const segment = rest.split("/")[0] ?? "";
  if (segment === "creation-center") return "creationCenter";
  if (segment === "topic-center") return "topicCenter";
  if (segment === "auto-publish") return "autoPublish";
  if (segment === "earn-points") return "earnPoints";
  if (segment === "account") return "account";
  if (segment === "asset-library") return "assetLibrary";
  if (segment === "works-library") return "worksLibrary";
  return "creationCenter";
}

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
          ? "flex h-9 cursor-pointer items-center gap-2 rounded-md bg-gray-200/60 px-2 text-sm font-medium text-gray-900 dark:bg-sidebar-border dark:text-gray-100"
          : "flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-sidebar-border/50"
      }
    >
      {icon}
      {label}
    </Link>
  );
}

export function AppShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeKey = resolveActiveKey(pathname, locale);
  const t = useTranslations();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-muted/40 dark:bg-muted/40">
      <div className="flex min-h-0 flex-1">
        <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-muted/30 text-foreground dark:bg-muted/20">
          <div className="flex h-14 items-center px-4">
            <Link
              href={`/${locale}/creation-center/new`}
              className="flex cursor-pointer items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-85 focus-visible:ring-0"
              aria-label={t("app.name")}
            >
              <div className="relative size-9 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image
                  src="/logo.png"
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="leading-tight">
                <div className="text-lg font-semibold">{t("app.name")}</div>
              </div>
            </Link>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-3 py-4">
            <div className="space-y-1">
              <NavItem
                href={`/${locale}/creation-center/new`}
                active={activeKey === "creationCenter"}
                icon={<PenSquareIcon className="size-4" />}
                label={t("sidebar.items.creationCenter")}
              />
              <AppShellProtectedNavItem
                href={`/${locale}/topic-center`}
                active={activeKey === "topicCenter"}
                icon={<LightbulbIcon className="size-4" />}
                label={t("sidebar.items.topicCenter")}
              />
              <AppShellProtectedNavItem
                href={`/${locale}/auto-publish`}
                active={activeKey === "autoPublish"}
                icon={<SendIcon className="size-4" />}
                label={t("sidebar.items.autoPublish")}
              />
            </div>

            <div className="space-y-1">
              <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {t("sidebar.groups.assets")}
              </div>
              <AppShellProtectedNavItem
                href={`/${locale}/account`}
                active={activeKey === "account"}
                icon={<UserRoundIcon className="size-4" />}
                label={t("sidebar.items.account")}
              />
              <AppShellProtectedNavItem
                href={`/${locale}/asset-library`}
                active={activeKey === "assetLibrary"}
                icon={<ImagesIcon className="size-4" />}
                label={t("sidebar.items.assetLibrary")}
              />
              <AppShellProtectedNavItem
                href={`/${locale}/works-library`}
                active={activeKey === "worksLibrary"}
                icon={<ListIcon className="size-4" />}
                label={t("sidebar.items.worksLibrary")}
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
            <AppShellSidebarFooter />
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="h-full min-h-0 w-full overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
