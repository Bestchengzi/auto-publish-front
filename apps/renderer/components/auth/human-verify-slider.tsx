"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export interface HumanVerifySliderProps {
  onVerify: () => void;
  verified?: boolean;
  className?: string;
  resetKey?: string;
}

/** 滑动验证：向右滑到底完成真人校验（短信验证码等场景可复用） */
export function HumanVerifySlider({
  onVerify,
  verified = false,
  className,
  resetKey,
}: HumanVerifySliderProps) {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const handleReset = useCallback(() => {
    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (resetKey) handleReset();
  }, [resetKey, handleReset]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (verified) return;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = (x / rect.width) * 100;
      progressRef.current = pct;
      setProgress(pct);
      if (pct >= 90) {
        onVerify();
      }
    },
    [verified, onVerify],
  );

  const handleEnd = useCallback(() => {
    if (progressRef.current < 90) {
      setProgress(0);
      progressRef.current = 0;
    }
    setIsDragging(false);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (verified) return;
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (verified) return;
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", handleEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  if (verified) {
    return (
      <div
        className={cn(
          "flex h-10 items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400",
          className,
        )}
      >
        <ShieldCheck className="size-4 shrink-0" />
        <span>验证通过</span>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      role="button"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setProgress(95);
          onVerify();
        }
      }}
      className={cn(
        "relative h-10 w-full cursor-pointer select-none overflow-visible rounded-lg border border-border bg-muted/50 dark:bg-muted/30",
        isDragging && "border-primary/50",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 bg-primary/15 dark:bg-primary/25",
          !isDragging && "transition-[width] duration-200 ease-out",
        )}
        style={{ width: `${progress}%` }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          {progress >= 90 ? "松开完成验证" : "向右滑动完成验证"}
        </span>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 left-0 flex w-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm dark:bg-card",
          !isDragging && "transition-[left] duration-200 ease-out",
        )}
        style={{ left: `clamp(0%, ${progress}%, calc(100% - 2.5rem))` }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
          aria-hidden
        >
          <path
            d="m13 17 5-5-5-5M6 17l5-5-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
