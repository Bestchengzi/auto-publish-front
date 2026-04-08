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
    // Skip next internals & static files
    "/((?!_next|.*\\..*|api).*)"
  ]
};

