"use client";

import { useEffect, useState } from "react";
import {
  ChevronRightIcon,
  CreditCardIcon,
  HouseIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";

import { LoginDialog } from "@/components/auth/login-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";
import { clearAuthRelatedQueryCache } from "@/lib/auth/query-cache";
import { clearAuthStorage, getAuthUser } from "@/lib/auth/session";
import {
  ACCENT_STORAGE_KEY,
  applyAccent,
  readAccentStorage,
  setAccentStorage,
  type AccentPreset,
} from "@/lib/ui-accent";

type SettingsTab = "account" | "settings";

function setLocaleCookie(locale: "zh-CN" | "en") {
  document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function switchLocalePath(pathname: string, nextLocale: "zh-CN" | "en") {
  const segments = pathname.split("/").filter(Boolean);
  const current = segments[0];
  if (current === "zh-CN" || current === "en") {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }
  return `/${nextLocale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function AppShellSidebarFooter() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const t = useTranslations("sidebar.items");
  const { ready, isLoggedIn } = useAuthLoggedIn();
  const [loginOpen, setLoginOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("account");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [accent, setAccent] = useState<AccentPreset>("violet");

  useEffect(() => {
    const syncUserName = () => {
      const user = getAuthUser();
      const name = user?.name?.trim();
      const fallbackId = user?.id?.trim();
      const phone = user?.phone?.trim();
      setUserName(
        name && name.length > 0
          ? name
          : fallbackId && fallbackId.length > 0
            ? fallbackId
            : "未命名用户",
      );
      setUserPhone(phone && phone.length > 0 ? phone : "");
    };
    syncUserName();
    window.addEventListener("media-auth-changed", syncUserName);
    window.addEventListener("storage", syncUserName);
    return () => {
      window.removeEventListener("media-auth-changed", syncUserName);
      window.removeEventListener("storage", syncUserName);
    };
  }, []);

  useEffect(() => {
    const openLoginDialog = () => setLoginOpen(true);
    window.addEventListener("media-auth-open-login", openLoginDialog);
    return () => {
      window.removeEventListener("media-auth-open-login", openLoginDialog);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAccent(readAccentStorage());

    const syncAccent = (event: StorageEvent) => {
      if (event.key && event.key !== ACCENT_STORAGE_KEY) return;
      setAccent(readAccentStorage());
    };
    window.addEventListener("storage", syncAccent);
    return () => {
      window.removeEventListener("storage", syncAccent);
    };
  }, []);

  if (!ready) {
    return <div className="min-h-12 p-3" />;
  }

  if (isLoggedIn) {
    const avatarLetter = Array.from(userName)[0] ?? "用";
    const localeSegment = pathname.split("/").filter(Boolean)[0];
    const locale = localeSegment === "en" ? "en" : "zh-CN";
    const localeLabels =
      locale === "en"
        ? { "zh-CN": "Chinese", en: "English" }
        : { "zh-CN": "中文", en: "英文" };
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-2 rounded-md p-3 text-left hover:bg-muted"
              />
            }
          >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
              {avatarLetter}
            </div>
            <div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {userName || "未命名用户"}
            </div>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="center"
            side="top"
            sideOffset={8}
            className="w-56 p-3"
          >
            <div className="flex items-center gap-3 p-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1 self-center">
                <div className="truncate text-base font-semibold text-foreground">
                  {userName || "未命名用户"}
                </div>
                {userPhone ? (
                  <div className="mt-0.5 text-sm text-muted-foreground">{userPhone}</div>
                ) : null}
              </div>
            </div>

            <DropdownMenuSeparator className="mx-2 my-1.5" />

            <DropdownMenuItem
              className="py-2"
              onClick={() => {
                setSettingsTab("account");
                setSettingsOpen(true);
              }}
            >
              <SettingsIcon className="size-4" />
              个人设置
            </DropdownMenuItem>
            <DropdownMenuItem
              className="py-2"
              onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
            >
              <HouseIcon className="size-4" />
              访问官网
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2">
              <CreditCardIcon className="size-4" />
              购买套餐
            </DropdownMenuItem>

            <DropdownMenuSeparator className="mx-2 my-1.5" />

            <DropdownMenuItem
              variant="destructive"
              className="py-2"
              onClick={() => {
                clearAuthStorage();
                clearAuthRelatedQueryCache(queryClient);
              }}
            >
              <LogOutIcon className="size-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-5xl overflow-hidden p-0">
            <div className="flex min-h-[560px]">
              <aside className="w-56 border-r bg-muted/20 p-3">
                <div className="mb-3 flex items-center gap-2 rounded-md p-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                    {avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {userName || "未命名用户"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      个人
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-2" />
                <button
                  type="button"
                  onClick={() => setSettingsTab("account")}
                  className={`mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    settingsTab === "account"
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  <UserIcon className="size-4" />
                  账户
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("settings")}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    settingsTab === "settings"
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  <SettingsIcon className="size-4" />
                  设置
                </button>
              </aside>

              <section className="flex-1 px-20 py-7">
                {settingsTab === "account" ? (
                  <div>
                    <h2 className="mb-5 text-2xl font-medium">账户</h2>
                    <DropdownMenuSeparator className="mb-6" />
                    <div>
                      <div className="flex items-center gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-semibold text-white">
                          {avatarLetter}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xl font-semibold">{userName}</div>
                          <div className="truncate text-sm text-muted-foreground">
                            {userPhone || getAuthUser()?.id || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="mb-5 text-2xl font-medium">设置</h2>
                    <DropdownMenuSeparator className="mb-6" />
                    <div className="space-y-8">
                      <div>
                        <div className="mb-2 text-sm font-normal">语言</div>
                        <Select
                          value={locale}
                          onValueChange={(value) => {
                            const next = value === "en" ? "en" : "zh-CN";
                            setLocaleCookie(next);
                            router.push(switchLocalePath(pathname, next));
                            router.refresh();
                          }}
                        >
                          <SelectTrigger className="h-9 w-48">
                            <SelectValue>{localeLabels[locale]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="zh-CN">
                              {localeLabels["zh-CN"]}
                            </SelectItem>
                            <SelectItem value="en">{localeLabels.en}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-normal">外观</div>
                        <div className="flex gap-5">
                          {[
                            {
                              key: "light",
                              label: "浅色",
                              previewClass:
                                "bg-white border border-border/70",
                              leftPaneClass: "bg-muted/40",
                              rightPaneClass: "bg-background",
                              lineClass: "bg-foreground/15",
                            },
                            {
                              key: "dark",
                              label: "深色",
                              previewClass:
                                "bg-zinc-900 border border-zinc-700/80",
                              leftPaneClass: "bg-zinc-800",
                              rightPaneClass: "bg-zinc-900",
                              lineClass: "bg-white/15",
                            },
                            {
                              key: "system",
                              label: "跟随系统",
                              previewClass:
                                "border border-border/70 bg-gradient-to-r from-white via-white to-zinc-900",
                              leftPaneClass:
                                "bg-gradient-to-b from-muted/40 to-background",
                              rightPaneClass:
                                "bg-gradient-to-b from-zinc-800 to-zinc-900",
                              lineClass: "bg-foreground/20",
                            },
                          ].map((item) => (
                            <Button
                              key={item.key}
                              type="button"
                              onClick={() => setTheme(item.key)}
                              variant="outline"
                              className={`h-auto w-24 flex-col rounded-xl p-2 text-xs hover:text-current ${
                                theme === item.key
                                  ? "border-primary ring-1 ring-primary"
                                  : "border-border hover:border-foreground/30"
                              }`}
                            >
                              <div
                                className={`mb-2 h-12 w-full overflow-hidden rounded-md ${item.previewClass}`}
                              >
                                <div className="flex h-full w-full">
                                  <div
                                    className={`flex w-1/3 items-start justify-center pt-2 ${item.leftPaneClass}`}
                                  >
                                    <div className={`h-1 w-5/6 rounded ${item.lineClass}`} />
                                  </div>
                                  <div
                                    className={`flex flex-1 flex-col gap-1.5 px-2 pt-2 ${item.rightPaneClass}`}
                                  >
                                    <div className={`h-1 w-3/4 rounded ${item.lineClass}`} />
                                    <div className={`h-1 w-2/3 rounded ${item.lineClass}`} />
                                  </div>
                                </div>
                              </div>
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-normal">主色</div>
                        <div className="flex gap-3">
                          {[
                            { key: "neutral" as AccentPreset, label: "黑色" },
                            { key: "blue" as AccentPreset, label: "蓝色" },
                            { key: "violet" as AccentPreset, label: "紫色" },
                          ].map((item) => (
                            <Button
                              key={item.key}
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setAccent(item.key);
                                setAccentStorage(item.key);
                                applyAccent(item.key);
                              }}
                              className={`h-8 rounded-md px-3 text-xs hover:text-current ${
                                accent === item.key
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-foreground/30"
                              }`}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex min-h-12 flex-col gap-2 p-3">
      <Button
        type="button"
        className="w-full"
        onClick={() => setLoginOpen(true)}
      >
        {t("login")}
      </Button>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
