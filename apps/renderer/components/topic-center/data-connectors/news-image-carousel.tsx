"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type NewsImageCarouselProps = {
  imageUrls: string[];
  videoUrls?: string[];
  className?: string;
};

type MediaItem = { type: "image" | "video"; url: string };

export function NewsImageCarousel({
  imageUrls,
  videoUrls = [],
  className,
}: NewsImageCarouselProps) {
  const mediaItems = React.useMemo<MediaItem[]>(
    () => [
      ...imageUrls.map((url) => ({ type: "image" as const, url })),
      ...videoUrls.map((url) => ({ type: "video" as const, url })),
    ],
    [imageUrls, videoUrls],
  );
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState<Record<number, boolean>>({});
  const videoRefs = React.useRef<Record<number, HTMLVideoElement | null>>({});
  const total = mediaItems.length;

  React.useEffect(() => {
    setActiveIndex((prev) => (prev >= total ? 0 : prev));
  }, [total]);

  if (total === 0) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const toggleVideoPlay = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (isPlaying[index]) video.pause();
    else void video.play();
    setIsPlaying((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative w-full">
        <div
          className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700"
          style={{ aspectRatio: "16/9" }}
        >
          {mediaItems.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={`${item.type}-${item.url}-${index}`}
                className={cn(
                  "absolute inset-0 transition-opacity duration-500",
                  isActive ? "z-10 opacity-100" : "z-0 opacity-0",
                )}
              >
                {item.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote article image urls
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                    aria-hidden
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                      }}
                      src={item.url}
                      className="h-full w-full object-contain"
                      controls={Boolean(isPlaying[index])}
                      onPlay={() =>
                        setIsPlaying((prev) => ({ ...prev, [index]: true }))
                      }
                      onPause={() =>
                        setIsPlaying((prev) => ({ ...prev, [index]: false }))
                      }
                    />
                    {!isPlaying[index] ? (
                      <div
                        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30"
                        onClick={() => toggleVideoPlay(index)}
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition-colors hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800">
                          <PlayIcon
                            className="ml-1 h-8 w-8 text-gray-900 dark:text-gray-100"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
          {total > 1 ? (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-4 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 p-2 shadow-lg transition-colors hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                onClick={handlePrev}
                aria-label="上一张"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-4 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 p-2 shadow-lg transition-colors hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                onClick={handleNext}
                aria-label="下一张"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
            </>
          ) : null}
        </div>

      </div>
      {total > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {mediaItems.map((item, index) => (
            <button
              key={`${item.type}-${item.url}-${index}-dot`}
              type="button"
              className={cn(
                "h-2 cursor-pointer rounded-full transition-all",
                index === activeIndex
                  ? "w-8 bg-blue-500 dark:bg-blue-400"
                  : "w-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500",
              )}
              onClick={() => setActiveIndex(index)}
              aria-label={`跳转到第 ${index + 1} 张`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
