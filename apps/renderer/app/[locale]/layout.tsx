import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthRouteGuard } from "@/components/auth/auth-route-guard";
import { DesktopChromeWrapper } from "@/components/desktop-chrome-wrapper";
import { QueryProvider } from "@/components/providers/query-provider";
import { getMessages } from "@/i18n/get-messages";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  const cookieStore = await cookies();
  const accent = cookieStore.get("UI_ACCENT")?.value ?? "violet";
  const accentClass =
    accent === "blue"
      ? "ui-accent-blue"
      : accent === "violet"
        ? "ui-accent-violet"
        : "";

  return (
    <html lang={safeLocale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${accentClass}`}
      >
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
      </body>
    </html>
  );
}
