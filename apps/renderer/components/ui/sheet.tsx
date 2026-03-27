"use client";

import * as React from "react";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const DrawerRoot = BaseDrawer.Root;
const DrawerPortal = BaseDrawer.Portal;
const DrawerBackdrop = BaseDrawer.Backdrop;
const DrawerViewport = BaseDrawer.Viewport;
const DrawerPopup = BaseDrawer.Popup;
const DrawerClose = BaseDrawer.Close;
const DrawerTitle = BaseDrawer.Title;

type SheetProps = React.ComponentProps<typeof DrawerRoot> & {
  side?: "left" | "right";
};

function Sheet({ side = "right", children, ...props }: SheetProps) {
  return (
    <DrawerRoot swipeDirection={side} {...props}>
      {children}
    </DrawerRoot>
  );
}

interface SheetContentProps extends React.ComponentProps<typeof DrawerPopup> {
  side?: "left" | "right";
  showCloseButton?: boolean;
  closeLabel?: string;
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  closeLabel = "关闭",
  ...props
}: SheetContentProps) {
  const isRight = side === "right";

  return (
    <DrawerPortal>
      <DrawerBackdrop
        className={cn(
          "fixed inset-0 z-50 bg-black/50",
          "data-[entering]:animate-in data-[exiting]:animate-out",
          "data-[entering]:fade-in-0 data-[exiting]:fade-out-0",
        )}
      />
      <DrawerViewport
        className={cn(
          "fixed inset-y-0 z-50 w-full max-w-[400px] overflow-hidden",
          isRight ? "right-0" : "left-0",
        )}
      >
        <DrawerPopup
          data-slot="sheet-content"
          className={cn(
            "flex h-full flex-col border-border bg-background shadow-xl outline-none",
            "transition-transform duration-300 ease-out",
            "data-[swipe-direction=right]:translate-x-[var(--drawer-swipe-movement-x,0)]",
            "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
            "[&[data-swipe-direction=left]]:data-[starting-style]:-translate-x-full [&[data-swipe-direction=left]]:data-[ending-style]:-translate-x-full",
            isRight && "border-l",
            !isRight && "border-r",
            className,
          )}
          style={
            {
              "--drawer-swipe-movement-x": "0px",
            } as React.CSSProperties
          }
          {...props}
        >
          {showCloseButton && (
            <DrawerClose
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none cursor-pointer"
              aria-label={closeLabel}
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">{closeLabel}</span>
            </DrawerClose>
          )}
          {children}
        </DrawerPopup>
      </DrawerViewport>
    </DrawerPortal>
  );
}

type SheetHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function SheetHeader({ className, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-border px-4",
        className,
      )}
      {...props}
    />
  );
}

type SheetTitleProps = React.ComponentProps<typeof DrawerTitle>;

function SheetTitleComponent({ className, ...props }: SheetTitleProps) {
  return (
    <DrawerTitle
      data-slot="sheet-title"
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
}

type SheetFooterProps = React.HTMLAttributes<HTMLDivElement>;

function SheetFooter({ className, ...props }: SheetFooterProps) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex shrink-0 justify-end gap-2 border-t border-border p-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitleComponent as SheetTitle,
  SheetFooter,
  DrawerClose as SheetClose,
};
