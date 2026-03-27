"use client";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Material } from "./types";

type MaterialCardProps = {
  material: Material;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel: string;
  deleteLabel: string;
  documentPreviewNotSupported: string;
  imagePreviewPlaceholder: string;
  videoPreviewPlaceholder: string;
};

export function MaterialCard({
  material,
  checked,
  onCheckedChange,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  documentPreviewNotSupported,
  imagePreviewPlaceholder,
  videoPreviewPlaceholder,
}: MaterialCardProps) {
  const isDocument = material.type === "document";
  const isVideo = material.type === "video";
  const previewContent = isDocument ? (
    <span className="text-sm text-muted-foreground">
      {documentPreviewNotSupported}
    </span>
  ) : material.previewUrl && material.type === "image" ? (
    /* eslint-disable-next-line @next/next/no-img-element -- blob URL from user upload */
    <img
      src={material.previewUrl}
      alt={material.name}
      className="h-full w-full object-cover rounded-lg"
    />
  ) : material.previewUrl && material.type === "video" ? (
    <video
      src={material.previewUrl}
      muted
      playsInline
      preload="metadata"
      className="h-full w-full object-cover rounded-lg"
      aria-label={material.name}
    />
  ) : (
    <span className="text-sm text-muted-foreground">
      {isVideo ? videoPreviewPlaceholder : imagePreviewPlaceholder}
    </span>
  );

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-border bg-card px-4 pt-2 pb-4 shadow-sm transition hover:shadow-md",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Checkbox
          aria-label="选择素材"
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(Boolean(v))}
        />
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="操作"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <PencilIcon className="size-4" />
                  {editLabel}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onDelete}
                >
                  <Trash2Icon className="size-4" />
                  {deleteLabel}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-1 flex flex-1 flex-col min-h-0">
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "group flex flex-1 flex-col min-h-0 w-full p-0 m-0 bg-transparent border-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl",
            onEdit && "cursor-pointer",
          )}
          aria-label="编辑素材"
        >
          <div
            className={cn(
              "relative flex w-full shrink-0 aspect-video items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50",
              onEdit && "group-hover:bg-muted/70 transition-colors",
            )}
          >
            {previewContent}
          </div>

          <div className="mt-3 w-full truncate text-center text-sm font-medium text-foreground">
            {material.name}
          </div>
        </button>
      </div>
    </div>
  );
}
