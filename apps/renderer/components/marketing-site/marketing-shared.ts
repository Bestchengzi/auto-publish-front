export function toDisplayAmount(raw: number): string {
  return (raw / 100).toFixed(2).replace(/\.00$/, "");
}

export function toDisplayPoints(raw: number, locale: string): string {
  return (raw / 100).toLocaleString(locale === "en" ? "en-US" : "zh-CN");
}

export function sectionMotion(reduce: boolean) {
  if (reduce) {
    return {
      initial: false,
      whileInView: undefined,
      viewport: undefined,
      transition: undefined,
    };
  }
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-48px" },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export const sectionContainer = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";
export const sectionHeading =
  "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white";
export const sectionLead =
  "mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400";
export const sectionDivider = "border-slate-200/50 dark:border-zinc-800/80";
