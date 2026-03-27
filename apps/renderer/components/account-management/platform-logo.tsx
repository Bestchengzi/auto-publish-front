"use client";

import { getPlatformLogoPath, type PlatformId } from "@/lib/platforms";

type PlatformLogoProps = {
  platformId: PlatformId;
  size?: number;
  className?: string;
};

export function PlatformLogo({ platformId, size = 20, className }: PlatformLogoProps) {
  const src = getPlatformLogoPath(platformId);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG from public, avoid Image optimization
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden
    />
  );
}
