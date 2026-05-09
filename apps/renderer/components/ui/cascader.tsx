"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CascaderOption = {
  value: string;
  label: string;
  children?: CascaderOption[];
};

type CascaderProps = {
  options: readonly CascaderOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  clearText?: string;
  className?: string;
};

function findOptionPath(
  options: readonly CascaderOption[],
  value: readonly string[],
): CascaderOption[] {
  const path: CascaderOption[] = [];
  let levelOptions = options;

  for (const itemValue of value) {
    const matched = levelOptions.find((option) => option.value === itemValue);
    if (!matched) return [];
    path.push(matched);
    levelOptions = matched.children ?? [];
  }

  return path;
}

export function Cascader({
  options,
  value,
  onValueChange,
  placeholder = "请选择",
  searchPlaceholder = "搜索...",
  emptyText = "暂无可选项",
  clearText = "清除",
  className,
}: CascaderProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [activeProvinceValue, setActiveProvinceValue] = React.useState<
    string | null
  >(null);
  const selectedPath = React.useMemo(() => findOptionPath(options, value), [
    options,
    value,
  ]);
  const selectedProvinceValue =
    activeProvinceValue ?? value[0] ?? options[0]?.value;
  const activeProvince =
    options.find((option) => option.value === selectedProvinceValue) ??
    options[0] ??
    null;
  const selectedLabel = selectedPath.map((option) => option.label).join(" / ");
  const searchResults = React.useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return [];

    return options.flatMap((province) =>
      (province.children ?? [])
        .filter(
          (city) =>
            province.label.toLowerCase().includes(keyword) ||
            city.label.toLowerCase().includes(keyword),
        )
        .map((city) => ({ province, city })),
    );
  }, [options, searchValue]);

  React.useEffect(() => {
    if (open) {
      setActiveProvinceValue(value[0] ?? options[0]?.value ?? null);
    } else {
      setSearchValue("");
    }
  }, [open, options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selectedLabel && "text-muted-foreground opacity-60",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[var(--anchor-width)] p-0"
      >
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder={searchPlaceholder}
          />
          {searchValue.trim() ? (
            <CommandList className="h-72 max-h-none">
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {searchResults.map(({ province, city }) => {
                  const selected =
                    value[0] === province.value && value[1] === city.value;
                  return (
                    <CommandItem
                      key={`${province.value}-${city.value}`}
                      value={`${province.label} ${city.label}`}
                      onSelect={() => {
                        onValueChange([province.value, city.value]);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {province.label} / {city.label}
                      </span>
                      {selected ? <CheckIcon className="size-4 shrink-0" /> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          ) : (
            <div className="grid h-72 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <CommandList className="max-h-none border-r">
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const active = option.value === activeProvince?.value;
                    return (
                      <CommandItem
                        key={option.value}
                        value={`${option.label} ${option.value}`}
                        onSelect={() => {
                          if (option.children?.length) {
                            setActiveProvinceValue(option.value);
                            return;
                          }
                          onValueChange([option.value]);
                          setOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer",
                          active && "bg-accent text-accent-foreground",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {option.label}
                        </span>
                        <ChevronRightIcon className="size-4 shrink-0 opacity-60" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
              <CommandList className="max-h-none">
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {(activeProvince?.children ?? []).map((city) => {
                    const selected =
                      value[0] === activeProvince?.value &&
                      value[1] === city.value;
                    return (
                      <CommandItem
                        key={city.value}
                        value={`${city.label} ${city.value}`}
                        onSelect={() => {
                          if (!activeProvince) return;
                          onValueChange([activeProvince.value, city.value]);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {city.label}
                        </span>
                        {selected ? (
                          <CheckIcon className="size-4 shrink-0" />
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </div>
          )}
          {value.length > 0 ? (
            <div className="flex justify-end border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onValueChange([]);
                  setOpen(false);
                }}
              >
                {clearText}
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
