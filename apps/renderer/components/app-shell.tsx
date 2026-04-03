import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ImagesIcon,
  LightbulbIcon,
  ListIcon,
  PenSquareIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react";

import { LocaleToggle } from "@/components/locale-toggle";
import { StyleToggle } from "@/components/style-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { RecentCreations } from "@/components/recent-creations/recent-creations";
import { Separator } from "@/components/ui/separator";

type ActiveKey =
  | "overview"
  | "account"
  | "assetLibrary"
  | "worksLibrary"
  | "topicCenter"
  | "creationCenter"
  | "autoPublish";

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
            </div>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-3 py-4">
            <div className="space-y-1">
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
              <NavItem
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
              <NavItem
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
