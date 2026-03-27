"use client";

import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Group } from "./types";

type GroupSidebarProps = {
  groups: Group[];
  groupFilter: string;
  groupCounts: Record<string, number>;
  onGroupFilterChange: (id: string) => void;
  onSettingsClick: () => void;
  title: string;
  settingsTooltip: string;
};

export function GroupSidebar({
  groups,
  groupFilter,
  groupCounts,
  onGroupFilterChange,
  onSettingsClick,
  title,
  settingsTooltip,
}: GroupSidebarProps) {
  return (
    <div className="rounded-xl border border-border p-3 lg:w-[260px] flex flex-col min-h-0 lg:self-stretch">
      <div className="h-12 -mx-3 -mt-3 mb-2 rounded-t-xl border-b border-border bg-muted/40 px-4 text-sm font-medium text-foreground">
        <div className="flex h-full items-center justify-between">
          <span>{title}</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={settingsTooltip}
                  onClick={onSettingsClick}
                >
                  <SettingsIcon className="size-4" />
                </Button>
              }
            />
            <TooltipContent side="top">
              <p>{settingsTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 flex-col gap-1 overflow-auto">
        {groups.map((g) => {
          const active = groupFilter === g.id;
          const count = groupCounts[g.id] ?? 0;
          return (
            <Button
              key={g.id}
              variant="ghost"
              onClick={() => onGroupFilterChange(g.id)}
              className={cn(
                "h-9 w-full justify-between rounded-lg px-2 text-sm",
                active
                  ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="truncate">{g.name}</span>
              <span
                className={cn(
                  "ml-2 inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 text-xs ring-1",
                  active
                    ? "bg-primary/10 text-primary ring-primary/20"
                    : "bg-muted text-muted-foreground ring-border",
                )}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
