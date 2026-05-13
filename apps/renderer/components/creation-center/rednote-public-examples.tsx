"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  listPublicImageTasks,
  type PublicImageTaskResponse,
} from "@/lib/api/image-tasks";
import { cn } from "@/lib/utils";
import { RednotePreviewDialog } from "./rednote-preview-dialog";

type RednotePublicExamplesProps = {
  enabled: boolean;
  className?: string;
  onUseExample?: (example: PublicImageTaskResponse) => void;
};

const REDNOTE_EXAMPLES_QUERY_SIZE = 20;
const REDNOTE_EXAMPLES_PAGE_SIZE = 5;

function getExampleTitle(example: PublicImageTaskResponse) {
  return example.title?.trim() || "";
}

function getExampleTag(example: PublicImageTaskResponse) {
  return example.tag?.trim() || "";
}

function getExampleImages(example: PublicImageTaskResponse | null) {
  return (example?.images ?? []).filter((image) => image.trim().length > 0);
}

export function getRednoteExampleReferenceImages(
  example: PublicImageTaskResponse,
) {
  return (example.input_images ?? []).filter((image) => image.trim().length > 0);
}

function getExampleContent(example: PublicImageTaskResponse) {
  return example.content?.trim() || "";
}

function RednoteExampleCard({
  example,
  onPreview,
  onUseExample,
}: {
  example: PublicImageTaskResponse;
  onPreview: (example: PublicImageTaskResponse) => void;
  onUseExample: (example: PublicImageTaskResponse) => void;
}) {
  const coverImage = getExampleImages(example)[0];
  if (!coverImage) return null;

  const title = getExampleTitle(example);
  const tag = getExampleTag(example);

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {tag ? (
          <span className="absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] truncate rounded-md bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            {tag}
          </span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- public image URLs are returned by the backend */}
        <img
          src={coverImage}
          alt={title}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 bg-black/35 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 cursor-pointer rounded-full bg-white/95 px-3 text-xs font-medium text-slate-950 shadow-sm ring-1 ring-black/10 hover:bg-white dark:bg-white/95 dark:text-slate-950 dark:ring-white/20 dark:hover:bg-white"
            onClick={() => onPreview(example)}
            title="预览"
          >
            <EyeIcon className="mr-1 size-3.5" />
            预览
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 cursor-pointer rounded-full bg-pink-500 px-3 text-xs font-medium text-white shadow-sm hover:bg-pink-600"
            onClick={() => onUseExample(example)}
            title="一键同款"
          >
            <WandSparklesIcon className="mr-1 size-3.5" />
            一键同款
          </Button>
        </div>
      </div>
      <div className="min-h-[72px] px-3.5 py-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
          {title}
        </h3>
      </div>
    </article>
  );
}

function RednoteExampleSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
      <div className="aspect-[3/4] animate-pulse bg-muted" />
      <div className="space-y-2 px-3.5 py-3">
        <div className="h-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function RednoteExamplePreviewDialog({
  example,
  onOpenChange,
  onUseExample,
}: {
  example: PublicImageTaskResponse | null;
  onOpenChange: (open: boolean) => void;
  onUseExample: (example: PublicImageTaskResponse) => void;
}) {
  const images = useMemo(() => getExampleImages(example), [example]);
  const title = example ? getExampleTitle(example) : "";
  const content = example ? getExampleContent(example) : "";
  return (
    <RednotePreviewDialog
      open={example != null}
      onOpenChange={onOpenChange}
      title={title}
      content={content}
      images={images}
      dialogTitle={title || "小红书公开案例预览"}
      action={{
        label: "一键同款",
        title: "一键同款",
        onClick: () => {
          if (!example) return;
          onUseExample(example);
          onOpenChange(false);
        },
      }}
    />
  );
}

export function RednotePublicExamples({
  enabled,
  className,
  onUseExample,
}: RednotePublicExamplesProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [previewExample, setPreviewExample] =
    useState<PublicImageTaskResponse | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["image-tasks", "public", "rednote-examples"],
    queryFn: () =>
      listPublicImageTasks({ page: 1, page_size: REDNOTE_EXAMPLES_QUERY_SIZE }),
    staleTime: 5 * 60_000,
    enabled,
  });

  const examples = useMemo(
    () =>
      (data?.items ?? []).filter((item) =>
        item.images.some((image) => image.trim().length > 0),
      ),
    [data],
  );
  const pageCount = Math.max(
    Math.ceil(examples.length / REDNOTE_EXAMPLES_PAGE_SIZE),
    1,
  );
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const canPaginate = !isLoading && examples.length > REDNOTE_EXAMPLES_PAGE_SIZE;

  if (!enabled || (!isLoading && examples.length === 0)) {
    return null;
  }

  return (
    <>
      <section className={cn("w-full max-w-[1360px]", className)}>
        <div className="mb-3 flex items-center px-1">
          <h2 className="text-base font-semibold text-foreground">
            生成案例
          </h2>
        </div>
        <div className="relative">
          {canPaginate ? (
            <button
              type="button"
              className="absolute -left-12 top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/60 disabled:pointer-events-none disabled:opacity-50 max-lg:left-2 dark:hover:bg-background/50"
              disabled={safePageIndex === 0}
              onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
              aria-label="上一组示例"
              title="上一组示例"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-white/95 shadow-md backdrop-blur dark:border-input dark:bg-background/95">
                <ChevronLeftIcon className="size-5" />
              </span>
            </button>
          ) : null}
          {canPaginate ? (
            <button
              type="button"
              className="absolute -right-12 top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-white/60 disabled:pointer-events-none disabled:opacity-50 max-lg:right-2 dark:hover:bg-background/50"
              disabled={safePageIndex >= pageCount - 1}
              onClick={() =>
                setPageIndex((current) => Math.min(current + 1, pageCount - 1))
              }
              aria-label="下一组示例"
              title="下一组示例"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-white/95 shadow-md backdrop-blur dark:border-input dark:bg-background/95">
                <ChevronRightIcon className="size-5" />
              </span>
            </button>
          ) : null}
          <div className="overflow-hidden pb-2">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${safePageIndex * 100}%)` }}
            >
              {isLoading ? (
                <div className="grid w-full shrink-0 grid-cols-5 gap-4">
                  {Array.from({ length: REDNOTE_EXAMPLES_PAGE_SIZE }).map(
                    (_, index) => (
                      <RednoteExampleSkeleton key={index} />
                    ),
                  )}
                </div>
              ) : (
                Array.from({ length: pageCount }).map((_, page) => (
                  <div
                    key={page}
                    className="grid w-full shrink-0 grid-cols-5 gap-4"
                  >
                    {examples
                      .slice(
                        page * REDNOTE_EXAMPLES_PAGE_SIZE,
                        page * REDNOTE_EXAMPLES_PAGE_SIZE +
                          REDNOTE_EXAMPLES_PAGE_SIZE,
                      )
                      .map((example, index) => (
                        <RednoteExampleCard
                          key={`${page}-${index}`}
                          example={example}
                          onPreview={setPreviewExample}
                          onUseExample={(item) => onUseExample?.(item)}
                        />
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
      <RednoteExamplePreviewDialog
        example={previewExample}
        onOpenChange={(open) => {
          if (!open) setPreviewExample(null);
        }}
        onUseExample={(item) => onUseExample?.(item)}
      />
    </>
  );
}
