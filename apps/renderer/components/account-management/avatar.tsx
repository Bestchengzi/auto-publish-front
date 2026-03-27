"use client";

import * as React from "react";

/** 头像背景色 - 纯色、协调的现代配色 */
const AVATAR_COLORS = [
  "#6366f1", // 靛蓝
  "#8b5cf6", // 紫
  "#ec4899", // 玫红
  "#14b8a6", // 青绿
  "#0ea5e9", // 天蓝
  "#f59e0b", // 琥珀
  "#10b981", // 翠绿
  "#ef4444", // 珊瑚红
];
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Avatar({
  seed,
  name,
  src,
  className,
}: {
  seed: string;
  name: string;
  /** Optional image URL. When provided, shows portrait instead of colored letter. */
  src?: string | null;
  className?: string;
}) {
  const [imgError, setImgError] = React.useState(false);
  React.useEffect(() => setImgError(false), [src]);
  const effectiveSrc = src && !imgError ? src : null;
  const letter = (name.trim()[0] ?? "?").toUpperCase();
  const colorIndex =
    Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          effectiveSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- src may be arbitrary CDN/blob URLs
            <img
              src={effectiveSrc}
              alt=""
              onError={() => setImgError(true)}
              className={cn(
                "size-8 shrink-0 cursor-pointer rounded-full object-cover ring-2 ring-background",
                className,
              )}
              aria-label={name}
            />
          ) : (
            <div
              className={cn(
                "grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-xs font-semibold text-white ring-2 ring-background",
                className,
              )}
              style={{ backgroundColor: bgColor }}
              aria-label={name}
            >
              {letter}
            </div>
          )
        }
      />
      <TooltipContent side="top">
        <p>{name}</p>
      </TooltipContent>
    </Tooltip>
  );
}
