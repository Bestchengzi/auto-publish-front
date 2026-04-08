"use client";

import * as React from "react";

import { applyAccent, readAccentStorage } from "@/lib/ui-accent";

export function AccentProvider({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const syncAccent = () => {
      applyAccent(readAccentStorage("violet"));
    };

    syncAccent();
    window.addEventListener("storage", syncAccent);
    return () => {
      window.removeEventListener("storage", syncAccent);
    };
  }, []);

  return <>{children}</>;
}
