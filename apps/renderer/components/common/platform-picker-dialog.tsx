"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PickerPlatformItem = {
  id: string;
  name: string;
  logo: string;
};

type PlatformPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: PickerPlatformItem[];
  disabledPlatformIds?: string[];
  closeLabel: string;
  title: string;
  description: string;
  onSelectPlatform: (platformId: string) => void;
};

export function PlatformPickerDialog({
  open,
  onOpenChange,
  platforms,
  disabledPlatformIds = [],
  closeLabel,
  title,
  description,
  onSelectPlatform,
}: PlatformPickerDialogProps) {
  const disabledSet = new Set(disabledPlatformIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={closeLabel} className="max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {platforms.map((p) => {
            const isDisabled = disabledSet.has(p.id);
            const logoSrc =
              p.logo.startsWith("http://") ||
              p.logo.startsWith("https://") ||
              p.logo.startsWith("/")
                ? p.logo
                : `/platform-logos/${p.logo}`;
            return (
              <button
                key={p.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  onOpenChange(false);
                  onSelectPlatform(p.id);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border border-transparent bg-transparent p-4 transition-colors",
                  isDisabled
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer hover:bg-accent/50 hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg" aria-hidden>
                  <Image
                    src={logoSrc}
                    alt=""
                    width={48}
                    height={48}
                    className="object-contain"
                    unoptimized
                    aria-hidden
                  />
                </div>
                <span className="text-center text-sm font-medium text-foreground">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
