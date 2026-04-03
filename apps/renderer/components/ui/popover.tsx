"use client";

import * as React from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

const PopoverRoot = BasePopover.Root;
const PopoverTrigger = BasePopover.Trigger;
const PopoverPortal = BasePopover.Portal;
const PopoverPositioner = BasePopover.Positioner;
const PopoverPopup = BasePopover.Popup;
const PopoverClose = BasePopover.Close;

function Popover(props: React.ComponentProps<typeof PopoverRoot>) {
  return <PopoverRoot {...props} />;
}

function PopoverTriggerComponent(props: React.ComponentProps<typeof PopoverTrigger>) {
  return <PopoverTrigger {...props} />;
}

interface PopoverContentProps
  extends React.ComponentProps<typeof PopoverPopup>,
    Pick<
      React.ComponentProps<typeof PopoverPositioner>,
      "side" | "sideOffset" | "align" | "alignOffset" | "anchor" | "positionMethod"
    > {
  positionerClassName?: string;
}

function PopoverContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  anchor,
  positionMethod,
  positionerClassName,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortal>
      <PopoverPositioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        positionMethod={positionMethod}
        className={cn("z-50", positionerClassName)}
      >
        <PopoverPopup
          data-slot="popover-content"
          className={cn(
            "z-50 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md outline-none",
            className,
          )}
          {...props}
        />
      </PopoverPositioner>
    </PopoverPortal>
  );
}

export { Popover, PopoverTriggerComponent as PopoverTrigger, PopoverContent, PopoverClose };
