"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";

function normalizePath(pathname: string): string {
  if (pathname.endsWith("/") && pathname.length > 1) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isAllowedWhenLoggedOut(pathname: string, locale: string): boolean {
  const normalized = normalizePath(pathname);
  if (normalized === `/${locale}/creation-center/new` || normalized === `/${locale}/topic-center`) {
    return true;
  }
  if (normalized === `/${locale}/site` || normalized.startsWith(`/${locale}/site/`)) {
    return true;
  }
  return false;
}

function AuthRouteGuardInner({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { ready, isLoggedIn } = useAuthLoggedIn();
  const targetPath = `/${locale}/creation-center/new`;
  const redirectFlag = "__authRedirect";
  const purchaseFlag = "__openPurchase";
  const purchaseAfterLoginKey = "media-open-plan-after-login";
  const normalizedPath = pathname ? normalizePath(pathname) : "";
  const isAllowedPath =
    pathname != null ? isAllowedWhenLoggedOut(pathname, locale) : true;
  const isProtectedPath = pathname != null && !isAllowedPath;

  useEffect(() => {
    if (!ready || isLoggedIn || !pathname) return;
    if (normalizedPath !== targetPath) return;
    if (searchParams.get(redirectFlag) !== "1") return;

    window.dispatchEvent(new Event("media-auth-open-login"));
    const nextUrl = `${targetPath}${window.location.hash || ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [
    isLoggedIn,
    normalizedPath,
    pathname,
    ready,
    searchParams,
    targetPath,
  ]);

  useEffect(() => {
    if (!ready || !pathname) return;
    if (normalizedPath !== targetPath) return;
    if (searchParams.get(purchaseFlag) !== "1") return;

    if (isLoggedIn) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(purchaseAfterLoginKey);
      }
      window.dispatchEvent(new Event("media-billing-open-plan"));
    } else {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(purchaseAfterLoginKey, "1");
      }
      window.dispatchEvent(new Event("media-auth-open-login"));
    }
    const nextUrl = `${targetPath}${window.location.hash || ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [
    isLoggedIn,
    normalizedPath,
    pathname,
    purchaseFlag,
    purchaseAfterLoginKey,
    ready,
    searchParams,
    targetPath,
  ]);

  useEffect(() => {
    if (!ready || isLoggedIn || !pathname) return;
    if (isAllowedPath) return;

    const targetUrl = `${targetPath}?${redirectFlag}=1`;
    // 使用硬重定向，避免客户端软跳转导致旧页面与新页面同时短暂渲染。
    window.location.replace(targetUrl);
  }, [isAllowedPath, isLoggedIn, pathname, ready, targetPath]);

  // 关键：受保护页面在未登录时不渲染，避免页面自身触发任何接口请求。
  if ((!ready && isProtectedPath) || (ready && !isLoggedIn && isProtectedPath)) {
    return null;
  }

  return <>{children}</>;
}

/** Suspense 包裹：静态导出 + useSearchParams 要求 */
export function AuthRouteGuard({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthRouteGuardInner locale={locale}>{children}</AuthRouteGuardInner>
    </Suspense>
  );
}
