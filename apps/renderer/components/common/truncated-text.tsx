"use client";

import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TruncatedTextProps = {
  text: string;
  containerClassName?: string;
  textClassName?: string;
  tooltipContentClassName?: string;
};

export function TruncatedText({
  text,
  containerClassName,
  textClassName,
  tooltipContentClassName,
}: TruncatedTextProps) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = React.useState(false);

  const measure = React.useCallback(() => {
    const element = textRef.current;
    if (!element) return;
    setTruncated(element.scrollWidth > element.clientWidth + 1);
  }, []);

  React.useLayoutEffect(() => {
    measure();
    const element = textRef.current;
    if (!element) return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [measure, text]);

  const label = (
    <span
      ref={textRef}
      className={cn("block min-w-0 truncate text-sm text-foreground", textClassName)}
    >
      {text}
    </span>
  );

  if (!truncated) {
    return <div className={cn("min-w-0 max-w-full", containerClassName)}>{label}</div>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn("min-w-0 max-w-full", containerClassName)}
        render={
          <div className={cn("min-w-0 max-w-full cursor-default outline-none", containerClassName)}>
            {label}
          </div>
        }
      />
      <TooltipContent side="top" className={cn("max-w-md", tooltipContentClassName)}>
        <p className="whitespace-pre-wrap break-words text-left">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
