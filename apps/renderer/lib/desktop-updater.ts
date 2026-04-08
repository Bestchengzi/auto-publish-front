"use client";

import * as React from "react";

import { getDesktop } from "@/lib/desktop-api";

import type { DesktopUpdateState } from "@/types/desktop";

const defaultState: DesktopUpdateState = {
  phase: "idle",
  currentVersion: "0.0.0",
};

export function useDesktopUpdater() {
  const [state, setState] = React.useState<DesktopUpdateState>(defaultState);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.updater) return;

    let mounted = true;
    void desktop.updater.getState().then((next) => {
      if (mounted) setState(next);
    });

    const unsubscribe = desktop.updater.onStateChanged((next) => {
      if (mounted) setState(next);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const check = React.useCallback(() => {
    const desktop = getDesktop();
    return desktop?.updater?.check?.();
  }, []);

  const install = React.useCallback(() => {
    const desktop = getDesktop();
    return desktop?.updater?.install?.();
  }, []);

  return { state, check, install };
}
