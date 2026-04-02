import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  showCount?: boolean
}

function Input({ className, type, showCount = false, value, maxLength, ...props }: InputProps) {
  const valueText = typeof value === "string" || typeof value === "number" ? String(value) : ""
  const shouldShowCount = showCount && typeof maxLength === "number" && maxLength > 0

  return (
    <div className="relative">
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground placeholder:opacity-60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          shouldShowCount && "pr-14",
          className
        )}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      {shouldShowCount && (
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
          {valueText.length}/{maxLength}
        </span>
      )}
    </div>
  )
}

export { Input }
