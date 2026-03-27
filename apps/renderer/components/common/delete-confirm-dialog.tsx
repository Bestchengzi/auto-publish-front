"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  closeLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  isPending?: boolean;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  closeLabel,
  title,
  description,
  cancelLabel,
  confirmLabel,
  isPending = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent closeLabel={closeLabel} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            size="default"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            size="default"
            onClick={() => void onConfirm()}
            disabled={isPending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

