export type AccentPreset = "neutral" | "blue" | "violet";

export const ACCENT_STORAGE_KEY = "UI_ACCENT";
export const ACCENT_BLUE_CLASS = "ui-accent-blue";
export const ACCENT_VIOLET_CLASS = "ui-accent-violet";

export const ACCENT_INIT_SCRIPT = `
(() => {
  try {
    const root = document.documentElement;
    root.classList.add("accent-preload");
    const v = localStorage.getItem("${ACCENT_STORAGE_KEY}");
    root.classList.remove("${ACCENT_BLUE_CLASS}", "${ACCENT_VIOLET_CLASS}");
    if (v === "blue") root.classList.add("${ACCENT_BLUE_CLASS}");
    else root.classList.add("${ACCENT_VIOLET_CLASS}");
    requestAnimationFrame(() => {
      root.classList.remove("accent-preload");
    });
  } catch {}
})();
`.trim();

export function applyAccent(preset: AccentPreset) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove(ACCENT_BLUE_CLASS, ACCENT_VIOLET_CLASS);
  if (preset === "blue") root.classList.add(ACCENT_BLUE_CLASS);
  if (preset === "violet") root.classList.add(ACCENT_VIOLET_CLASS);
}

export function readAccentStorage(defaultPreset: AccentPreset = "violet"): AccentPreset {
  if (typeof window === "undefined") return defaultPreset;
  const raw = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  return raw === "blue" || raw === "violet" || raw === "neutral"
    ? raw
    : defaultPreset;
}

export function setAccentStorage(preset: AccentPreset) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCENT_STORAGE_KEY, preset);
}
