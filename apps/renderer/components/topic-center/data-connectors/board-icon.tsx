"use client";

import * as React from "react";
import { PlugIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const DEFAULT_TOPIC_ICONS = new Map([
  ["icon-tech", { emoji: "\u2708\uFE0F", bgColor: "bg-teal-500" }],
  ["icon-creative", { emoji: "\uD83D\uDE80", bgColor: "bg-blue-500" }],
  ["icon-finance", { emoji: "\uD83D\uDCB0", bgColor: "bg-amber-400" }],
  ["icon-energy", { emoji: "\u26A1", bgColor: "bg-purple-500" }],
  ["icon-achievement", { emoji: "\u2B50", bgColor: "bg-indigo-500" }],
  ["icon-passion", { emoji: "\uD83D\uDD25", bgColor: "bg-orange-500" }],
  ["icon-value", { emoji: "\uD83D\uDC8E", bgColor: "bg-sky-500" }],
  ["icon-art", { emoji: "\uD83D\uDEE1\uFE0F", bgColor: "bg-rose-500" }],
  ["icon-target", { emoji: "\uD83C\uDFF9", bgColor: "bg-amber-600" }],
  ["icon-education", { emoji: "\uD83D\uDCDA", bgColor: "bg-indigo-500" }],
  ["icon-health", { emoji: "\uD83C\uDF31", bgColor: "bg-emerald-600" }],
  ["icon-retail", { emoji: "\uD83D\uDCE6", bgColor: "bg-violet-500" }],
]);

const HASH_FALLBACK_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-violet-500",
];

function normalizeIconValue(iconUrl: string | null | undefined): string | null {
  const normalizedIconUrl = iconUrl?.trim();
  return normalizedIconUrl || null;
}

function getLastPathSegment(value: string): string | null {
  if (!value) return null;

  try {
    const pathname = new URL(value).pathname;
    return pathname.split("/").filter(Boolean).pop() ?? null;
  } catch {
    const pathWithoutQuery = value.split(/[?#]/)[0] ?? "";
    return pathWithoutQuery.split("/").filter(Boolean).pop() ?? null;
  }
}

function extractDefaultTopicIconKey(
  iconUrl: string | null | undefined,
): string | null {
  const normalizedIconUrl = normalizeIconValue(iconUrl);
  if (!normalizedIconUrl) return null;

  if (normalizedIconUrl.startsWith("icon-")) {
    return normalizedIconUrl;
  }

  const lastPathSegment = getLastPathSegment(normalizedIconUrl);
  if (lastPathSegment?.startsWith("icon-")) {
    return lastPathSegment;
  }

  return null;
}

function resolveBoardIconUrl(iconUrl: string | null | undefined): string | null {
  const normalizedIconUrl = normalizeIconValue(iconUrl);
  if (!normalizedIconUrl) return null;
  if (extractDefaultTopicIconKey(normalizedIconUrl)) return null;

  return normalizedIconUrl.startsWith("https://") ? normalizedIconUrl : null;
}

function simpleHash(value: string): number {
  if (!value) return 0;

  let hash = 0;
  for (const char of Array.from(value)) {
    const code = char.codePointAt(0) ?? 0;
    hash = (hash << 5) - hash + code;
    hash |= 0;
  }

  return Math.abs(hash);
}

function getFallbackContent(name: string | null | undefined) {
  const normalizedName = name?.trim() ?? "";
  if (!normalizedName) {
    return {
      bgColor: HASH_FALLBACK_COLORS[0],
      char: null,
    };
  }

  return {
    bgColor:
      HASH_FALLBACK_COLORS[
        simpleHash(normalizedName) % HASH_FALLBACK_COLORS.length
      ],
    char: Array.from(normalizedName)[0] ?? null,
  };
}

export function BoardIcon({
  iconUrl,
  name,
  className,
  imageClassName,
  textClassName,
}: {
  iconUrl?: string | null;
  name?: string | null;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
}) {
  const defaultTopicIconKey = React.useMemo(
    () => extractDefaultTopicIconKey(iconUrl),
    [iconUrl],
  );
  const defaultTopicIcon = React.useMemo(
    () =>
      defaultTopicIconKey
        ? DEFAULT_TOPIC_ICONS.get(defaultTopicIconKey)
        : undefined,
    [defaultTopicIconKey],
  );
  const resolvedIconUrl = React.useMemo(
    () => resolveBoardIconUrl(iconUrl),
    [iconUrl],
  );
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [resolvedIconUrl]);

  const fallback = React.useMemo(() => getFallbackContent(name), [name]);

  if (resolvedIconUrl && !imgError) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote/provider icon urls are dynamic */}
        <img
          src={resolvedIconUrl}
          alt=""
          className={cn("size-full", imageClassName)}
          aria-hidden
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (defaultTopicIcon) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden text-white",
          className,
          defaultTopicIcon.bgColor,
        )}
        aria-hidden
      >
        <span className={cn("leading-none", textClassName)}>
          {defaultTopicIcon.emoji}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden text-white",
        className,
        fallback.bgColor,
      )}
      aria-hidden
    >
      {fallback.char ? (
        <span className={cn("font-semibold leading-none", textClassName)}>
          {fallback.char}
        </span>
      ) : (
        <PlugIcon className="size-5" />
      )}
    </div>
  );
}
