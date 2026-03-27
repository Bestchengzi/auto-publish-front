"use client";

import * as React from "react";
import { getDesktop } from "@/lib/desktop-api";

import type { TabItem } from "./types";

export function ExternalTabPlaceholder({
  tabId,
  url,
  loadError,
}: {
  tabId: string;
  url: string;
  loadError?: TabItem["loadError"];
  onRetry: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const desktop = getDesktop();

  React.useEffect(() => {
    if (loadError) return;
    desktop?.externalTab?.load?.(tabId, url);
  }, [tabId, url, desktop, loadError]);

  React.useEffect(() => {
    if (loadError) return;
    const el = ref.current;
    const setBounds = desktop?.externalTab?.setBounds;
    if (!el || !setBounds) return;

    const send = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBounds({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    send();
    const ro = new ResizeObserver(send);
    ro.observe(el);
    return () => ro.disconnect();
  }, [desktop, loadError]);

  if (loadError) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center overflow-y-auto bg-background px-6 py-10 md:px-10">
        <div className="w-full max-w-xl shrink-0 -translate-y-14 md:-translate-y-32">
          {/* <ExternalTabLoadErrorPanel
            loadError={loadError}
            fallbackUrl={url}
            onReload={onRetry}
          /> */}
        </div>
      </div>
    );
  }

  return <div ref={ref} className="h-full w-full" aria-hidden />;
}
