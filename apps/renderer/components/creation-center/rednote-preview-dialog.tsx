"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type RednotePreviewDialogAction = {
  label: string;
  title?: string;
  className?: string;
  onClick: () => void;
};

type RednotePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  images: string[];
  dialogTitle?: string;
  action?: RednotePreviewDialogAction;
};

export function RednotePreviewDialog({
  open,
  onOpenChange,
  title,
  content,
  images,
  dialogTitle,
  action,
}: RednotePreviewDialogProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const previewImages = useMemo(
    () => images.filter((image) => image.trim().length > 0),
    [images],
  );
  const imageCount = previewImages.length;
  const activeImage =
    previewImages[Math.min(imageIndex, Math.max(imageCount - 1, 0))];

  useEffect(() => {
    setImageIndex(0);
  }, [open, title, previewImages]);

  const showPreviousImage = () => {
    if (imageCount <= 1) return;
    setImageIndex((current) => (current - 1 + imageCount) % imageCount);
  };

  const showNextImage = () => {
    if (imageCount <= 1) return;
    setImageIndex((current) => (current + 1) % imageCount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(94vw,1120px)] max-w-[1120px] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl dark:bg-zinc-950"
      >
        <DialogTitle className="sr-only">
          {dialogTitle || title || "小红书图文预览"}
        </DialogTitle>
        <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-200 px-6 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            {title ? (
              <h2 className="line-clamp-1 text-xl font-semibold text-slate-950 dark:text-white">
                {title}
              </h2>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {action ? (
              <Button
                type="button"
                className={cn(
                  "h-9 rounded-lg bg-[#ff2442] px-5 text-sm font-semibold text-white hover:bg-[#e91d3b]",
                  action.className,
                )}
                onClick={action.onClick}
                title={action.title ?? action.label}
              >
                {action.label}
              </Button>
            ) : null}
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
                {/* eslint-disable-next-line @next/next/no-img-element -- preview image URLs are returned by the backend */}
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
                  {previewImages.map((image, index) => (
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
