"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  listPublicImageTasks,
  type PublicImageTaskResponse,
} from "@/lib/api/image-tasks";
import { cn } from "@/lib/utils";

type RednotePublicExamplesProps = {
  enabled: boolean;
  className?: string;
};

const REDNOTE_EXAMPLES_QUERY_SIZE = 20;
const REDNOTE_EXAMPLES_PAGE_SIZE = 5;

function getExampleTitle(example: PublicImageTaskResponse) {
  return example.title?.trim() || "";
}

function getExampleImages(example: PublicImageTaskResponse | null) {
  return (example?.images ?? []).filter((image) => image.trim().length > 0);
}

function getExampleContent(example: PublicImageTaskResponse) {
  return example.content?.trim() || "";
}

function RednoteExampleCard({
  example,
  onPreview,
}: {
  example: PublicImageTaskResponse;
  onPreview: (example: PublicImageTaskResponse) => void;
}) {
  const coverImage = getExampleImages(example)[0];
  if (!coverImage) return null;

  const title = getExampleTitle(example);

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06]">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
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
            className="h-8 cursor-pointer rounded-full bg-white px-3 text-xs font-medium text-foreground shadow-sm hover:bg-white"
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
}: {
  example: PublicImageTaskResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = useMemo(() => getExampleImages(example), [example]);
  const title = example ? getExampleTitle(example) : "";
  const content = example ? getExampleContent(example) : "";
  const imageCount = images.length;
  const activeImage = images[Math.min(imageIndex, Math.max(imageCount - 1, 0))];

  useEffect(() => {
    setImageIndex(0);
  }, [example]);

  const showPreviousImage = () => {
    if (imageCount <= 1) return;
    setImageIndex((current) => (current - 1 + imageCount) % imageCount);
  };

  const showNextImage = () => {
    if (imageCount <= 1) return;
    setImageIndex((current) => (current + 1) % imageCount);
  };

  return (
    <Dialog open={example != null} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(94vw,1120px)] max-w-[1120px] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl dark:bg-zinc-950"
      >
        <DialogTitle className="sr-only">{title || "小红书精品案例预览"}</DialogTitle>
        <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-200 px-6 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            {title ? (
              <h2 className="line-clamp-1 text-xl font-semibold text-slate-950 dark:text-white">
                {title}
              </h2>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button
              type="button"
              className="h-9 rounded-lg bg-[#ff2442] px-5 text-sm font-semibold text-white hover:bg-[#e91d3b]"
              title="一键同款"
            >
              一键同款
            </Button>
            <button
              type="button"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              onClick={() => onOpenChange(false)}
              aria-label="关闭"
              title="关闭"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        </header>

        <div className="grid h-[min(76vh,680px)] min-h-[520px] grid-cols-[58%_42%] max-md:h-auto max-md:min-h-0 max-md:grid-cols-1">
          <div className="relative flex items-center justify-center bg-slate-50 px-10 py-8 dark:bg-zinc-900/60 max-md:min-h-[420px]">
            {imageCount > 1 ? (
              <span className="absolute right-5 top-5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                {imageIndex + 1}/{imageCount}
              </span>
            ) : null}
            {activeImage ? (
              <div className="relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element -- public image URLs are returned by the backend */}
                <img
                  src={activeImage}
                  alt={title}
                  className="max-h-[560px] max-w-full object-contain"
                />
              </div>
            ) : null}
            {imageCount > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-5 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white shadow-sm transition-colors hover:bg-black/55"
                  onClick={showPreviousImage}
                  aria-label="上一张"
                  title="上一张"
                >
                  <ChevronLeftIcon className="size-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-5 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white shadow-sm transition-colors hover:bg-black/55"
                  onClick={showNextImage}
                  aria-label="下一张"
                  title="下一张"
                >
                  <ChevronRightIcon className="size-5" />
                </button>
                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={cn(
                        "size-2 cursor-pointer rounded-full transition-colors",
                        index === imageIndex
                          ? "bg-[#ff2442]"
                          : "bg-slate-300 hover:bg-slate-400 dark:bg-zinc-600 dark:hover:bg-zinc-500",
                      )}
                      onClick={() => setImageIndex(index)}
                      aria-label={`切换到第 ${index + 1} 张`}
                      title={`第 ${index + 1} 张`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside className="flex min-h-0 flex-col bg-white dark:bg-zinc-950">
            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
              {title ? (
                <h3 className="text-lg font-semibold leading-7 text-slate-950 dark:text-white">
                  {title}
                </h3>
              ) : null}
              {content ? (
                <div className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700 dark:text-zinc-300">
                  {content}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RednotePublicExamples({
  enabled,
  className,
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
          <h2 className="text-base font-semibold text-foreground">精品示例</h2>
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
      />
    </>
  );
}
