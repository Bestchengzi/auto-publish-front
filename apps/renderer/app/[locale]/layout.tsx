import localFont from "next/font/local";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthRouteGuard } from "@/components/auth/auth-route-guard";
import { DesktopChromeWrapper } from "@/components/desktop-chrome-wrapper";
import { AccentProvider } from "@/components/providers/accent-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { getMessages } from "@/i18n/get-messages";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { APP_BOOTSTRAP_OVERLAY_SCRIPT } from "@/lib/app-bootstrap-overlay";
import { ACCENT_INIT_SCRIPT } from "@/lib/ui-accent";
import { setRequestLocale } from "next-intl/server";

const geistSans = localFont({
  src: "../fonts/Geist/Geist-VariableFont_wght.ttf",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../fonts/Geist_Mono/GeistMono-VariableFont_wght.ttf",
  variable: "--font-geist-mono",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  const messages = await getMessages(safeLocale);

  const title =
    typeof (messages as { app?: { name?: unknown } }).app?.name === "string"
      ? ((messages as { app?: { name?: string } }).app?.name ??
        "Media Auto Publish")
      : "Media Auto Publish";

  const description =
    typeof (messages as { app?: { metaDescription?: unknown } }).app
      ?.metaDescription === "string"
      ? ((messages as { app?: { metaDescription?: string } }).app
          ?.metaDescription ?? "")
      : "A cross-platform publisher built with Next.js + Electron + shadcn/ui.";

  return {
    title,
    description,
    icons: {
      icon: "/logo.png",
      shortcut: "/logo.png",
      apple: "/logo.png",
    },
    alternates: {
      canonical: `/${safeLocale}`,
      languages: {
        "zh-CN": "/zh-CN",
        en: "/en",
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  // Tell next-intl which locale this request is for.
  setRequestLocale(safeLocale);

  const messages = await getMessages(safeLocale);

  return (
    <html lang={safeLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCENT_INIT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{ __html: APP_BOOTSTRAP_OVERLAY_SCRIPT }}
        />
        <AccentProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider locale={safeLocale} messages={messages}>
              <QueryProvider>
                <TooltipProvider>
                  <AuthRouteGuard locale={safeLocale}>
                    <DesktopChromeWrapper>{children}</DesktopChromeWrapper>
                  </AuthRouteGuard>
                  <Toaster />
                </TooltipProvider>
              </QueryProvider>
            </NextIntlClientProvider>
          </ThemeProvider>
        </AccentProvider>
      </body>
    </html>
  );
}
