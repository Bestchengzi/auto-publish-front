"use client";

import * as React from "react";
import Image from "next/image";
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
  avatarUrl?: string | null;
  trailingLogoUrl?: string | null;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** 已选值不在 `options` 里时用于展示触发器文案（例如按条件筛选后选项变少） */
  resolveSelectedLabel?: (value: string) => string | undefined;
  /** 已选值不在 `options` 里时用于展示触发器头像（与 resolveSelectedLabel 配对） */
  resolveSelectedAvatar?: (value: string) => string | null | undefined;
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
  resolveSelectedLabel,
  resolveSelectedAvatar,
  onBlur,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedSet = React.useMemo(() => new Set(values), [values]);
  const labelByValue = React.useMemo(
    () => new Map(options.map((o) => [o.value, o.label])),
    [options],
  );
  const avatarByValue = React.useMemo(
    () => new Map(options.map((o) => [o.value, o.avatarUrl])),
    [options],
  );
  const selectedItems = React.useMemo(
    () =>
      values.map((v) => ({
        value: v,
        label: labelByValue.get(v) ?? resolveSelectedLabel?.(v) ?? v,
        avatar: avatarByValue.get(v) ?? resolveSelectedAvatar?.(v) ?? null,
      })),
    [
      values,
      labelByValue,
      avatarByValue,
      resolveSelectedLabel,
      resolveSelectedAvatar,
    ],
  );

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
          "flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-left text-base md:text-sm",
          className,
        )}
      >
        {values.length === 0 ? (
          <span className="min-w-0 flex-1 truncate text-muted-foreground opacity-60">
            {placeholder}
          </span>
        ) : (
          <span className="block min-w-0 flex-1 truncate whitespace-nowrap">
            {selectedItems.map((item, i) => (
              <span key={item.value} className="inline align-middle">
                {item.avatar ? (
                  <Image
                    src={item.avatar}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    referrerPolicy="no-referrer"
                    className="mr-1 inline-block size-5 rounded-full object-cover align-middle"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                <span className="text-foreground align-middle">{item.label}</span>
                {i < selectedItems.length - 1 ? (
                  <span className="text-muted-foreground">、</span>
                ) : null}
              </span>
            ))}
          </span>
        )}
        <ChevronDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
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
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Checkbox
                      checked={checked}
                      className="data-checked:[&_[data-slot=checkbox-indicator]_svg]:!text-white"
                    />
                    {opt.avatarUrl ? (
                      <Image
                        src={opt.avatarUrl}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                        referrerPolicy="no-referrer"
                        className="size-5 shrink-0 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="truncate">{opt.label}</span>
                    {opt.trailingLogoUrl ? (
                      <Image
                        src={opt.trailingLogoUrl}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                        className="ml-auto size-5 shrink-0 rounded-sm object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
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

