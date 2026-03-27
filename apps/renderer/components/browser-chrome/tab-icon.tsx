"use client";

import * as React from "react";
import { GlobeIcon, Loader2Icon } from "lucide-react";

import type { TabItem } from "./types";
import { getAppFaviconUrl } from "./utils";

export function TabIcon({ tab }: { tab: TabItem }) {
  const [faviconFailed, setFaviconFailed] = React.useState(false);
  if ((tab.isExternal || tab.platformAuthId) && tab.loading) {
    return <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />;
  }
  if (tab.isEmpty) {
    return <GlobeIcon className="size-4 shrink-0 text-muted-foreground" />;
  }
  const faviconUrl =
    tab.favicon ?? (!tab.isExternal ? getAppFaviconUrl() : undefined);
  if (faviconUrl && !faviconFailed) {
    // eslint-disable-next-line @next/next/no-img-element -- third-party favicon URLs are not next/image remote-configurable
    return <img src={faviconUrl} alt="" className="size-4 shrink-0 object-contain" onError={() => setFaviconFailed(true)} />;
  }
  return <GlobeIcon className="size-4 shrink-0 text-muted-foreground" />;
}
