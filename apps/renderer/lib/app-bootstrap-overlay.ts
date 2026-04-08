/**
 * 在 body 最前同步执行：Electron 主窗口在 React hydration 前常长时间白屏，先铺一层 loading。
 * 仅主窗口（有 desktop 且非嵌入 WebView）；纯浏览器访问不注入。
 */
export const APP_BOOTSTRAP_OVERLAY_SCRIPT = `
(function(){
  try {
    if (typeof window === "undefined") return;
    if (!window.desktop || window.__desktopEmbeddedView) return;
    var el = document.createElement("div");
    el.id = "app-bootstrap-overlay";
    el.setAttribute("aria-busy", "true");
    el.setAttribute("aria-live", "polite");
    el.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#fafafa";
    var spin = document.createElement("div");
    spin.style.cssText = "width:40px;height:40px;border:3px solid rgba(0,0,0,0.06);border-top-color:#7c3aed;border-radius:50%";
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        el.style.background = "#0a0a0a";
        spin.style.borderColor = "rgba(255,255,255,0.08)";
        spin.style.borderTopColor = "#a78bfa";
      }
    } catch (e) {}
    spin.style.animation = "app-bootstrap-spin 0.75s linear infinite";
    var st = document.createElement("style");
    st.textContent = "@keyframes app-bootstrap-spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(st);
    el.appendChild(spin);
    document.body.appendChild(el);
  } catch (e) {}
})();
`.trim();

/** 浏览器壳（BrowserChrome）已挂载后再调用，避免先露出无壳布局再闪出壳子 */
export function dismissAppBootstrapOverlay() {
  if (typeof document === "undefined") return;
  document.getElementById("app-bootstrap-overlay")?.remove();
}
