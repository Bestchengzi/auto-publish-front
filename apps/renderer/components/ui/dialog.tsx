"use client";

import * as React from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const DialogRoot = BaseDialog.Root;
const DialogPortal = BaseDialog.Portal;
const DialogBackdrop = BaseDialog.Backdrop;
const DialogPopup = BaseDialog.Popup;
const DialogClose = BaseDialog.Close;
const DialogTitle = BaseDialog.Title;
const DialogDescription = BaseDialog.Description;

type DialogProps = React.ComponentProps<typeof DialogRoot>;

function Dialog({ children, ...props }: DialogProps) {
  return <DialogRoot {...props}>{children}</DialogRoot>;
}

type DialogTriggerProps = React.ComponentProps<typeof BaseDialog.Trigger>;

function DialogTrigger(props: DialogTriggerProps) {
  return <BaseDialog.Trigger {...props} />;
}

interface DialogContentProps extends React.ComponentProps<typeof DialogPopup> {
  showCloseButton?: boolean;
  closeLabel?: string;
  /** 关闭按钮容器（扩大点按区域、位移等） */
  closeButtonClassName?: string;
  /** 关闭图标尺寸，默认 h-4 w-4 */
  closeIconClassName?: string;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel = "关闭",
  closeButtonClassName,
  closeIconClassName,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogBackdrop
        className={cn(
          "fixed inset-0 z-50 bg-black/50",
          "duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          "motion-reduce:transition-none motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none",
        )}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
        <DialogPopup
          data-slot="dialog-content"
          className={cn(
            "relative w-full max-w-lg rounded-xl border bg-background px-6 py-4 shadow-lg outline-none",
            "origin-center backface-hidden",
            "duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-top-2",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-top-2",
            "motion-reduce:transition-none motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none",
            className,
          )}
          {...props}
        >
          {showCloseButton && (
            <DialogClose
              className={cn(
                "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none disabled:pointer-events-none cursor-pointer",
                closeButtonClassName,
              )}
              aria-label={closeLabel}
            >
              <XIcon className={cn("h-4 w-4", closeIconClassName)} />
              <span className="sr-only">{closeLabel}</span>
            </DialogClose>
          )}
          {children}
        </DialogPopup>
      </div>
    </DialogPortal>
  );
}

type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        // Title + description in a column, with some spacing below
        "mb-4 flex flex-col space-y-1.5 text-left",
        className,
      )}
      {...props}
    />
  );
}

type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        // 与页面主操作按钮一致（如 h-9「新建定时计划」）
        "[&_[data-slot=button]]:h-9",
        className,
      )}
      {...props}
    />
  );
}

type DialogTitleComponentProps = React.ComponentProps<typeof DialogTitle>;

function DialogTitleComponent({
  className,
  ...props
}: DialogTitleComponentProps) {
  return (
    <DialogTitle
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
}

type DialogDescriptionComponentProps = React.ComponentProps<
  typeof DialogDescription
>;

function DialogDescriptionComponent({
  className,
  ...props
}: DialogDescriptionComponentProps) {
  return (
    <DialogDescription
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitleComponent as DialogTitle,
  DialogDescriptionComponent as DialogDescription,
  DialogClose,
};
