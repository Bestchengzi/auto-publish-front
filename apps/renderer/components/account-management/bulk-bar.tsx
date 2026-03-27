"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Group } from "./types";

type BulkBarProps = {
  selectedCount: number;
  groups?: Group[];
  onMoveToGroup?: (groupId: string) => void;
  onDeleteSelected: () => void;
  selectedCountLabel: string;
  moveToGroupLabel?: string;
  batchDeleteLabel: string;
  showMoveToGroup?: boolean;
};

export function BulkBar({
  selectedCount,
  groups = [],
  onMoveToGroup,
  onDeleteSelected,
  selectedCountLabel,
  moveToGroupLabel,
  batchDeleteLabel,
  showMoveToGroup = true,
}: BulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="h-12 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4">
      <div className="text-sm">{selectedCountLabel}</div>
      <div className="flex items-center gap-2">
        {showMoveToGroup && groups.length > 0 && onMoveToGroup && moveToGroupLabel && (
          <Select
            value=""
            onValueChange={(v) => {
              if (!v) return;
              onMoveToGroup(v);
            }}
          >
            <SelectTrigger size="default" className="gap-1.5">
              <span className="font-medium">{moveToGroupLabel}</span>
              <SelectValue className="sr-only" />
            </SelectTrigger>
            <SelectContent align="end" className="w-48">
              <SelectGroup>
                <SelectLabel>{moveToGroupLabel}</SelectLabel>
                {groups
                  .filter((g) => g.id !== "all")
                  .map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
        <Button variant="destructive" className="gap-1.5" onClick={onDeleteSelected}>
          <Trash2Icon className="size-4" />
          {batchDeleteLabel}
        </Button>
      </div>
    </div>
  );
}
