import createMiddleware from "next-intl/middleware";

import { defaultLocale, locales } from "@/i18n/config";

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  // Always prefix locales in the URL for best SEO & shareable links.
  localePrefix: "always"
});

export const config = {
  matcher: [
    // Skip next internals & static files
    "/((?!_next|.*\\..*|api).*)"
  ]
};

