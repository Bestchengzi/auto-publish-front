"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onBlur?: () => void;
  className?: string;
};

export function MultiSelect({
  options,
  values,
  onValuesChange,
  placeholder = "请选择",
  searchPlaceholder = "搜索...",
  emptyText = "无可选项",
  onBlur,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedSet = React.useMemo(() => new Set(values), [values]);
  const displayText = React.useMemo(() => {
    const selected = options
      .filter((opt) => selectedSet.has(opt.value))
      .map((opt) => opt.label);
    return selected.join("、");
  }, [options, selectedSet]);

  const toggleValue = React.useCallback(
    (value: string) => {
      if (selectedSet.has(value)) {
        onValuesChange(values.filter((v) => v !== value));
      } else {
        onValuesChange([...values, value]);
      }
    },
    [onValuesChange, selectedSet, values],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) onBlur?.();
      }}
    >
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full cursor-pointer items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-base md:text-sm",
          className,
        )}
      >
        <span
          className={cn(
            "truncate",
            displayText ? "text-foreground" : "text-muted-foreground opacity-60",
          )}
        >
          {displayText || placeholder}
        </span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-[var(--anchor-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = selectedSet.has(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${opt.value}`}
                    onSelect={() => toggleValue(opt.value)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={checked}
                      className="data-checked:[&_[data-slot=checkbox-indicator]_svg]:!text-white"
                    />
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

