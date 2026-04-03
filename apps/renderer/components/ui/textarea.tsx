import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  /**
   * Controls user resize behavior.
   * - "none": disable manual resize (default)
   * - "vertical": allow drag to change height
   * - "both": allow drag to change width and height
   * - "horizontal": allow drag to change width
   */
  resizeMode?: "none" | "vertical" | "both" | "horizontal"
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, resizeMode = "none", ...props }, ref) => {
  const resizeClass =
    resizeMode === "vertical"
      ? "resize-y"
      : resizeMode === "both"
        ? "resize"
        : resizeMode === "horizontal"
          ? "resize-x"
          : "resize-none"
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex min-h-[60px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        resizeClass,
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
