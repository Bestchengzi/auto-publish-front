"use client";

import * as React from "react";

export type UseInfiniteScrollAnchorOptions = {
  canLoadMore: boolean;
  disabled?: boolean;
  onLoadMore: () => void;
  rootRef?: React.RefObject<Element | null>;
  rootMargin?: string;
  threshold?: number;
};

export function useInfiniteScrollAnchor<T extends Element = HTMLDivElement>({
  canLoadMore,
  disabled = false,
  onLoadMore,
  rootRef,
  rootMargin = "0px 0px 80px 0px",
  threshold = 0,
}: UseInfiniteScrollAnchorOptions) {
  const anchorRef = React.useRef<T | null>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);

  React.useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  React.useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !canLoadMore || disabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        onLoadMoreRef.current();
      },
      {
        root: rootRef?.current ?? undefined,
        rootMargin,
        threshold,
      },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [canLoadMore, disabled, rootMargin, rootRef, threshold]);

  return anchorRef;
}
