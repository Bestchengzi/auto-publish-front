"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import dayjs from "dayjs";

import {
  getTopicCenterBoardItemDetail,
  type TopicBoardItemDetailResponse,
  type TopicDataListItemResponse,
} from "@/lib/api/data-connectors";
import { apiUrl } from "@/lib/api/config";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { TopicCenterTranslator } from "./types";
import { NewsImageCarousel } from "./news-image-carousel";

type BoardItemDetailSheetProps = {
  open: boolean;
  boardId: string | null;
  item: TopicDataListItemResponse | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    title: string;
    content_text: string;
    source_name: string;
    published_at: string;
    source_url: string;
    author: string;
    image_urls: string;
    cover_image_url: string;
  }) => Promise<void>;
  creating?: boolean;
  t: TopicCenterTranslator;
};

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function pickExtraString(
  extra: Record<string, unknown> | undefined,
  keys: string[],
): string | null {
  if (!extra) return null;
  for (const key of keys) {
    const value = pickString(extra[key]);
    if (value) return value;
  }
  return null;
}

function pickNestedExtraString(
  extra: Record<string, unknown> | undefined,
  parentKeys: string[],
  childKeys: string[],
): string | null {
  if (!extra) return null;
  for (const parentKey of parentKeys) {
    const parent = extra[parentKey];
    if (!parent || typeof parent !== "object") continue;
    for (const childKey of childKeys) {
      const value = pickString((parent as Record<string, unknown>)[childKey]);
      if (value) return value;
    }
  }
  return null;
}

function resolveDetailTitle(
  detail: TopicBoardItemDetailResponse | undefined,
  item: TopicDataListItemResponse | null,
): string {
  return (
    pickString(detail?.title) ??
    pickExtraString(detail?.extra, ["zh_title", "zhTitle", "title"]) ??
    pickString(item?.title) ??
    ""
  );
}

function resolveDetailBody(
  detail: TopicBoardItemDetailResponse | undefined,
  item: TopicDataListItemResponse | null,
): string {
  return (
    pickString(detail?.content_text) ??
    pickString(detail?.content) ??
    pickExtraString(detail?.extra, [
      "zh_content",
      "zhContent",
      "content_text",
      "content",
      "full_text",
      "body",
    ]) ??
    pickString(detail?.summary) ??
    pickString(item?.summary) ??
    ""
  );
}

function formatPublishedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : null;
}

function resolveSourceLogo(
  detail: TopicBoardItemDetailResponse | undefined,
  item: TopicDataListItemResponse | null,
): string | null {
  return (
    pickNestedExtraString(detail?.extra, ["source"], ["logo", "logo_url", "icon_url"]) ??
    pickExtraString(detail?.extra, [
      "source_logo",
      "sourceLogo",
      "source_icon_url",
      "sourceIconUrl",
      "logo_url",
      "logo",
    ]) ??
    pickNestedExtraString(item?.extra, ["source"], ["logo", "logo_url", "icon_url"]) ??
    pickExtraString(item?.extra, [
      "source_logo",
      "sourceLogo",
      "source_icon_url",
      "sourceIconUrl",
      "logo_url",
      "logo",
    ])
  );
}

function resolveMediaType(
  detail: TopicBoardItemDetailResponse | undefined,
  item: TopicDataListItemResponse | null,
): string | null {
  return (
    pickNestedExtraString(detail?.extra, ["source"], ["media_type", "mediaType"]) ??
    pickExtraString(detail?.extra, ["media_type", "mediaType", "source_type"]) ??
    pickNestedExtraString(item?.extra, ["source"], ["media_type", "mediaType"]) ??
    pickExtraString(item?.extra, ["media_type", "mediaType", "source_type"])
  );
}

function resolveSourceName(
  detail: TopicBoardItemDetailResponse | undefined,
  item: TopicDataListItemResponse | null,
): string | null {
  return (
    pickNestedExtraString(detail?.extra, ["source"], ["name"]) ??
    pickExtraString(detail?.extra, ["source_name", "sourceName"]) ??
    pickNestedExtraString(item?.extra, ["source"], ["name"]) ??
    pickString(detail?.source_name) ??
    pickString(item?.source_name)
  );
}

function resolveLogoSrc(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return apiUrl(trimmed);
  return apiUrl(`/${trimmed}`);
}

function parseMediaUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return [item.trim()];
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return [
            pickString(record.url),
            pickString(record.localPath),
            pickString(record.local_path),
            pickString(record.path),
          ].filter((it): it is string => Boolean(it));
        }
        return [];
      })
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseMediaUrls(parsed);
    } catch {
      // fallback to comma split
    }
  }

  return trimmed
    .split(",")
    .map((it) => it.trim())
    .filter(Boolean);
}

function renderBodyWithParagraphSpacing(content: string): React.ReactNode {
  const lines = content.split("\n");
  return lines.map((line, index) => (
    <React.Fragment key={`line-${index}`}>
      {line}
      {index < lines.length - 1 && (
        <>
          <br />
          <br />
        </>
      )}
    </React.Fragment>
  ));
}

export function BoardItemDetailSheet({
  open,
  boardId,
  item,
  onOpenChange,
  onCreate,
  creating = false,
  t,
}: BoardItemDetailSheetProps) {
  const itemId = item?.item_id ?? null;
  const detailQuery = useQuery({
    queryKey: ["topic-center", "board-item-detail", boardId, itemId],
    queryFn: () => getTopicCenterBoardItemDetail(boardId!, itemId!),
    enabled: open && Boolean(boardId && itemId),
    staleTime: 60 * 1000,
  });

  const detail = detailQuery.data;
  const title = resolveDetailTitle(detail, item);
  const body = resolveDetailBody(detail, item);
  const sourceName = resolveSourceName(detail, item);
  const sourceIconUrl = resolveLogoSrc(resolveSourceLogo(detail, item));
  const mediaType = resolveMediaType(detail, item);
  const [logoLoadFailed, setLogoLoadFailed] = React.useState(false);
  const publishedAt =
    formatPublishedAt(detail?.published_at) ?? formatPublishedAt(item?.published_at ?? null);
  const originalUrl =
    pickString(detail?.source_url) ??
    pickExtraString(detail?.extra, ["source_url", "sourceUrl", "url"]) ??
    pickString(detail?.content_url) ??
    pickExtraString(detail?.extra, ["content_url", "contentUrl"]) ??
    pickExtraString(item?.extra, ["source_url", "sourceUrl"]) ??
    pickString(item?.content_url);
  const imageUrls = React.useMemo(() => {
    const fromDetail = parseMediaUrls(detail?.image_urls);
    const fromExtra = parseMediaUrls(
      detail?.extra?.image_urls ?? detail?.extra?.imageUrls,
    );
    const fromItemExtra = parseMediaUrls(item?.extra?.image_urls ?? item?.extra?.imageUrls);
    const cover = [
      pickString(detail?.cover_image_url),
      pickString(item?.cover_image_url),
    ].filter((it): it is string => Boolean(it));

    return Array.from(new Set([...fromDetail, ...fromExtra, ...fromItemExtra, ...cover]));
  }, [detail?.cover_image_url, detail?.extra, detail?.image_urls, item?.cover_image_url, item?.extra]);
  const videoUrls = React.useMemo(() => {
    const fromDetailField = parseMediaUrls(detail?.video_urls);
    const fromDetail = parseMediaUrls(
      detail?.extra?.video_urls ?? detail?.extra?.videoUrls,
    );
    const fromItemExtra = parseMediaUrls(item?.extra?.video_urls ?? item?.extra?.videoUrls);
    return Array.from(new Set([...fromDetailField, ...fromDetail, ...fromItemExtra]));
  }, [detail?.extra, detail?.video_urls, item?.extra]);
  React.useEffect(() => {
    setLogoLoadFailed(false);
  }, [sourceIconUrl]);

  const handleCreate = React.useCallback(async () => {
    await onCreate({
      title: title || "",
      content_text: body || "",
      source_name: sourceName || "",
      published_at: publishedAt || "",
      source_url: originalUrl || "",
      author:
        pickExtraString(detail?.extra, ["author"]) ??
        pickExtraString(item?.extra, ["author"]) ??
        "",
      image_urls: imageUrls.join(","),
      cover_image_url:
        pickString(item?.cover_image_url) ??
        pickString(detail?.cover_image_url) ??
        (imageUrls[0] ?? ""),
    });
  }, [
    body,
    detail?.cover_image_url,
    detail?.extra,
    imageUrls,
    item?.cover_image_url,
    item?.extra,
    onCreate,
    originalUrl,
    publishedAt,
    sourceName,
    title,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        maxWidth="820px"
        className="w-[min(92vw,820px)] border-l bg-background p-0"
        closeLabel={t("dataConnectors.boardDetail.close")}
      >
        <div className="flex h-full min-h-0 flex-col bg-background">
          <div className="scrollbar-hover min-h-0 flex-1 overflow-y-auto">
            {detailQuery.isPending ? (
              <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8">
                <Skeleton className="h-9 w-32 rounded-md" />
                <Skeleton className="h-10 w-4/5 rounded-md" />
                <Skeleton className="h-8 w-3/5 rounded-md" />
                <div className="h-px w-full bg-border" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-11/12 rounded-md" />
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                </div>
              </div>
            ) : detailQuery.isError ? (
              <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
                {t("dataConnectors.boardDetail.loadError")}
              </div>
            ) : (
              <article className="mx-auto w-full max-w-4xl px-6 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8">
                <div className="mb-4 flex items-center gap-2">
                  {sourceIconUrl && !logoLoadFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic source logo URL
                    <img
                      referrerPolicy="no-referrer"
                      src={sourceIconUrl}
                      alt=""
                      className="size-9 rounded-lg border border-gray-200 object-cover dark:border-gray-600"
                      aria-hidden
                      onError={() => setLogoLoadFailed(true)}
                    />
                  ) : mediaType === "网站" || mediaType?.toLowerCase() === "website" ? (
                    <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                      <GlobeIcon className="size-5" />
                    </div>
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-medium text-white">
                      {(sourceName?.[0] ?? "S").toUpperCase()}
                    </div>
                  )}
                  {sourceName || mediaType ? (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {sourceName ?? mediaType}
                    </span>
                  ) : null}
                </div>

                {title ? (
                  <h2 className="mb-4 text-2xl leading-tight font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
                    {title}
                  </h2>
                ) : null}

                {(publishedAt || mediaType || originalUrl) && (
                  <div className="mb-8 flex flex-col gap-3 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-4">
                      {publishedAt ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {publishedAt}
                        </span>
                      ) : null}
                      {mediaType ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {mediaType}
                        </span>
                      ) : null}
                      {originalUrl ? (
                        <a
                          href={originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLinkIcon className="size-4" />
                          {t("dataConnectors.boardDetail.viewOriginal")}
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-gray-700 sm:prose-base lg:prose-lg dark:prose-invert dark:text-gray-300">
                  <div className="leading-relaxed">
                    {body
                      ? renderBodyWithParagraphSpacing(body)
                      : t("dataConnectors.boardDetail.emptyContent")}
                  </div>
                </div>

                {imageUrls.length > 0 || videoUrls.length > 0 ? (
                  <NewsImageCarousel
                    imageUrls={imageUrls}
                    videoUrls={videoUrls}
                    className="mt-4"
                  />
                ) : null}
              </article>
            )}
          </div>
          <div className="shrink-0 border-t border-border bg-background px-6 py-4 sm:px-8 lg:px-12">
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-9 px-4"
                onClick={() => onOpenChange(false)}
                disabled={creating}
              >
                {t("dataConnectors.configDialog.cancel")}
              </Button>
              <Button
                type="button"
                variant="default"
                size="lg"
                className="h-9 px-4"
                onClick={() => void handleCreate()}
                disabled={creating}
              >
                {creating ? t("dataConnectors.loading") : t("dataConnectors.board.createAction")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
