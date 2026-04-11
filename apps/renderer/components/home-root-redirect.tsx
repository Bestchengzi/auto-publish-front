"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";

/** 仅域名 / `/{locale}` 根路径：有登录态进新建对话，否则进营销官网页 */
export function HomeRootRedirect({ locale }: { locale: string }) {
  const router = useRouter();
  const { ready, isLoggedIn } = useAuthLoggedIn();

  useEffect(() => {
    if (!ready) return;
    const path = isLoggedIn
      ? `/${locale}/creation-center/new`
      : `/${locale}/site`;
    router.replace(path);
  }, [isLoggedIn, locale, ready, router]);

  return null;
}
