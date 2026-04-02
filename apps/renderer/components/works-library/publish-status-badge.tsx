"use client";

import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublishStatus } from "./types";

export function PublishStatusBadge({
  status,
  successLabel,
  failedLabel,
  publishingLabel,
  className,
}: {
  status: PublishStatus;
  successLabel: string;
  failedLabel: string;
  publishingLabel: string;
  className?: string;
}) {
  const config = {
    success: {
      icon: CheckCircleIcon,
      label: successLabel,
      className: "text-emerald-600 dark:text-emerald-400",
    },
    failed: {
      icon: XCircleIcon,
      label: failedLabel,
      className: "text-destructive",
    },
    publishing: {
      icon: ClockIcon,
      label: publishingLabel,
      className: "text-amber-600 dark:text-amber-400",
    },
  };

  const { icon: Icon, label, className: statusClassName } = config[status];

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5 text-sm font-medium",
        statusClassName,
        className,
      )}
      title={label}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
