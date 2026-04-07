"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      data-slot="pagination"
      className={cn(
        "flex w-full flex-wrap items-center justify-end gap-2",
        className,
      )}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row flex-wrap items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("list-none", className)}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn("size-8", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4" />
    </Button>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn("size-8", className)}
      {...props}
    >
      <ChevronRightIcon className="size-4" />
    </Button>
  );
}

function PaginationPageButton({
  className,
  isActive,
  ...props
}: React.ComponentProps<typeof Button> & { isActive?: boolean }) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      size="icon-sm"
      className={cn(
        "h-8 min-w-8 px-1.5 font-normal tabular-nums sm:min-w-8",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
      {...props}
    />
  );
}

function PaginationEllipsis({
  className,
  screenReaderLabel,
  ...props
}: React.ComponentProps<"span"> & { screenReaderLabel: string }) {
  return (
    <span
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center text-muted-foreground",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" aria-hidden />
      <span className="sr-only">{screenReaderLabel}</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationPageButton,
  PaginationEllipsis,
};
