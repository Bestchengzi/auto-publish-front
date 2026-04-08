"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { BrowserChrome } from "@/components/browser-chrome";
import { getDesktopChromeMode } from "@/lib/desktop-chrome-mode";

export function DesktopChromeWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const mode = useSyncExternalStore(
    () => () => {},
    getDesktopChromeMode,
    () => "web",
  );

  if (mode === "embedded" || mode === "web") {
    return (
      <div className="flex h-screen min-h-screen flex-col">
        {children}
      </div>
    );
  }

  return <BrowserChrome />;
}
