"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

type ImagePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
};

export function ImagePreviewDialog({
  open,
  onOpenChange,
  src,
  alt = "preview-image",
}: ImagePreviewDialogProps) {
  const safeSrc = (src ?? "").trim();
  const dialogOpen = open && Boolean(safeSrc);

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="w-[min(94vw,1200px)] max-w-[1200px] p-3"
        closeButtonClassName="right-2 top-2 p-1.5"
        closeIconClassName="size-5"
      >
        <div className="flex max-h-[82vh] min-h-[320px] items-center justify-center overflow-hidden rounded-md bg-black/5">
          {safeSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={safeSrc}
              alt={alt}
              className="h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
