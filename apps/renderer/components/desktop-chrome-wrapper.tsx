"use client";

import * as React from "react";
import { BrowserChrome } from "@/components/browser-chrome";
import { isDesktop } from "@/lib/desktop-api";

export function DesktopChromeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDesktopEnv, setIsDesktopEnv] = React.useState(false);

  /** 用 layout effect 在绘制前切换壳层，避免整页刷新后出现一帧「无浏览器壳」布局，主内容区高度突变把选题中心等页顶栏挤出视口 */
  React.useLayoutEffect(() => {
    setIsDesktopEnv(isDesktop());
  }, []);

  if (!isDesktopEnv) {
    return (
      <div className="flex h-screen min-h-screen flex-col">
        {children}
      </div>
    );
  }

  return (
    <BrowserChrome>
      <div className="h-full min-h-0 overflow-hidden">{children}</div>
    </BrowserChrome>
  );
}
