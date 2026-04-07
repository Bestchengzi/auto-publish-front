import { redirect } from "next/navigation";

/**
 * 带 locale 的根路径（如 /zh-CN/）：默认进入新建对话，与 /creation-center 行为一致。
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/creation-center/new`);
}
