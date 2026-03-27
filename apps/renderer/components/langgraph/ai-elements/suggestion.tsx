"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Children, type ComponentProps } from "react";

const STAGGER_DELAY_MS = 60;
const STAGGER_DELAY_MS_OFFSET = 250;

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <ScrollArea className="overflow-x-auto whitespace-nowrap" {...props}>
    <div className={cn("flex w-max flex-nowrap items-center gap-2", className)}>
      {Children.map(children, (child, index) =>
        child != null ? (
          <span
            className="animate-in fade-in slide-in-from-bottom-2 inline-block duration-300 ease-out fill-mode-backwards"
            style={{
              animationDelay: `${STAGGER_DELAY_MS_OFFSET + index * STAGGER_DELAY_MS}ms`,
            }}
          >
            {child}
          </span>
        ) : (
          child
        ),
      )}
    </div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  icon: Icon,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <Button
      className={cn(
        "text-muted-foreground cursor-pointer rounded-full px-4 text-xs font-normal",
        /* outline 在深色下默认 dark:bg-input/30，叠在聊天文字上会透底；用实色表面 */
        "dark:border-border dark:bg-card dark:hover:bg-muted dark:aria-expanded:bg-muted dark:hover:text-foreground dark:aria-expanded:text-foreground",
        className,
      )}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {Icon && <Icon className="size-4" />}
      {children || suggestion}
    </Button>
  );
};
