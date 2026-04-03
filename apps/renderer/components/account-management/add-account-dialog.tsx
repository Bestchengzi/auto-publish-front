"use client";

import {
  PlatformPickerDialog,
  type PickerPlatformItem,
} from "@/components/common/platform-picker-dialog";

type Platform = PickerPlatformItem;

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
    <PlatformPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      platforms={platforms}
      closeLabel={closeLabel}
      title={title}
      description={description}
      onSelectPlatform={onSelectPlatform}
    />
  );
}
