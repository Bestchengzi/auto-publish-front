"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlatformLogo } from "./platform-logo";
import { cn } from "@/lib/utils";

type Platform = {
  id: string;
  name: string;
  logo: string;
};

type AddAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: Platform[];
  closeLabel: string;
  title: string;
  description: string;
  onSelectPlatform: (platformId: string) => void;
};

export function AddAccountDialog({
  open,
  onOpenChange,
  platforms,
  closeLabel,
  title,
  description,
  onSelectPlatform,
}: AddAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={closeLabel} className="max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onOpenChange(false);
                onSelectPlatform(p.id);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-transparent bg-transparent p-4 transition-colors",
                "hover:bg-accent/50 hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg" aria-hidden>
                <PlatformLogo platformId={p.id as import("@/lib/platforms").PlatformId} size={48} />
              </div>
              <span className="text-center text-sm font-medium text-foreground">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
