import { AccountManagement } from "@/components/account-management";
import { AppShell } from "@/components/app-shell";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="account">
      <AccountManagement />
    </AppShell>
  );
}

