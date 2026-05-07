export function formatBillingPoints(raw: number, locale: string): string {
  return Math.floor(raw / 100).toLocaleString(
    locale === "en" ? "en-US" : "zh-CN",
  );
}
