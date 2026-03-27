"use client";

import * as React from "react";

import {
  Tooltip as TooltipPrimitive,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Tooltip({
  children,
  content,
  ...props
}: {
  children: React.ReactNode;
  content?: React.ReactNode;
}) {
  const trigger = React.Children.only(children);
  if (!React.isValidElement(trigger)) {
    throw new Error("Tooltip expects a single React element as child.");
  }
  return (
    <TooltipPrimitive {...props}>
      {/* Base UI Trigger 默认是 <button>，子级不能再包一层 Button，需用 render 合并到同一 DOM */}
      <TooltipTrigger render={trigger} />
      <TooltipContent>{content}</TooltipContent>
    </TooltipPrimitive>
  );
}
