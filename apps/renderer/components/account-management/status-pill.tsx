import { DotIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusId } from "./types";

export function StatusPill({
  status,
  onlineLabel,
  offlineLabel,
}: {
  status: StatusId;
  onlineLabel: string;
  offlineLabel: string;
}) {
  const isOnline = status === "online";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        isOnline
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60"
          : "bg-muted text-muted-foreground ring-border",
      )}
    >
      <DotIcon
        className={cn(
          "size-4",
          isOnline ? "text-emerald-600" : "text-muted-foreground",
        )}
      />
      {isOnline ? onlineLabel : offlineLabel}
    </span>
  );
}
