"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";
import { isDesktop } from "@/lib/desktop-api";

/** 仅域名 / `/{locale}` 根路径：网页端按 token 分流；桌面端默认进新建对话页 */
export function HomeRootRedirect({ locale }: { locale: string }) {
  const router = useRouter();
  const { ready, isLoggedIn } = useAuthLoggedIn();

  useEffect(() => {
    if (!ready) return;
    const path = isDesktop()
      ? `/${locale}/creation-center/new`
      : isLoggedIn
        ? `/${locale}/creation-center/new`
        : `/${locale}/site`;
    router.replace(path);
  }, [isLoggedIn, locale, ready, router]);

  return null;
}
