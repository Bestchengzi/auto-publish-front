import { AppShell } from "@/components/app-shell";

export default async function MainAppLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AppShell locale={locale}>{children}</AppShell>;
}
