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
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel = "关闭",
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogBackdrop
        className={cn(
          "fixed inset-0 z-50 bg-black/50",
          // Base UI 使用 data-starting-style / data-ending-style（与 Radix 的 entering/exiting 不同）
          "transition-opacity duration-200 ease-out",
          "opacity-100 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        )}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
        <DialogPopup
          data-slot="dialog-content"
          className={cn(
            "relative w-full max-w-lg rounded-xl border bg-background px-6 py-4 shadow-lg outline-none",
            // Base UI 只提供 data-starting-style / data-ending-style，不自带动画。用任意属性把位移+缩放写进同一
            // 条 transform，避免 Tailwind 默认 translate/scale 拆属性导致过渡断裂。
            "origin-center backface-hidden",
            "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "opacity-100 [transform:translate(0,0)_scale(1)]",
            "data-[starting-style]:opacity-0 data-[starting-style]:[transform:translate(0,-0.5rem)_scale(0.96)]",
            "data-[ending-style]:opacity-0 data-[ending-style]:[transform:translate(0,-0.5rem)_scale(0.96)]",
            "motion-reduce:transition-none motion-reduce:duration-0",
            className,
          )}
          {...props}
        >
          {showCloseButton && (
            <DialogClose
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer"
              aria-label={closeLabel}
            >
              <XIcon className="h-4 w-4" />
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
