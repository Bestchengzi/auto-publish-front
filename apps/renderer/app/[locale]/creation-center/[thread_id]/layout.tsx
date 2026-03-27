import { LanggraphChatProviders } from "@/components/creation-center/langgraph-chat-providers";

export default async function CreationCenterThreadLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <LanggraphChatProviders appLocale={locale}>
      {children}
    </LanggraphChatProviders>
  );
}
