import { redirect } from "next/navigation";

export default async function CreationCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/creation-center/new`);
}
