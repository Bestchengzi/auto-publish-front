import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { defaultLocale, locales } from "@/i18n/config";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  // Always prefix locales in the URL for best SEO & shareable links.
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Skip next internals、静态资源、以及 next.config 中的 /baseApi 反向代理前缀。
    // 否则 localePrefix: "always" 会把 /baseApi/... 重写成 /zh-CN/baseApi/...，本地 fetch 得到 404。
    "/((?!_next|.*\\..*|media).*)"
  ]
};

