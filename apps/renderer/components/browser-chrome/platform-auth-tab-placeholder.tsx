"use client";

import * as React from "react";

import { getDesktop } from "@/lib/desktop-api";

export function PlatformAuthTabPlaceholder({
  tabId,
  platformId,
}: {
  tabId: string;
  platformId: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const desktop = getDesktop();

  React.useEffect(() => {
    desktop?.externalTab?.loadPlatformAuth?.(tabId, platformId);
  }, [tabId, platformId, desktop]);

  React.useEffect(() => {
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
  }, [desktop]);

  return <div ref={ref} className="h-full w-full" aria-hidden />;
}
