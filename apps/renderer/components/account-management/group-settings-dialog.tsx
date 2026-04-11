"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "@/components/ui/popover";
import type { Group } from "./types";

type GroupSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editableGroups: Group[];
  newGroupName: string;
  onNewGroupNameChange: (v: string) => void;
  onCreateGroup: () => void;
  editingGroupId: string | null;
  editingGroupName: string;
  onEditingGroupNameChange: (v: string) => void;
  onStartRename: (g: Group) => void;
  onSaveRename: () => void | Promise<void>;
  onCancelRename: () => void;
  onDeleteGroup: (id: string) => void;
  t: (key: string) => string;
  /** i18n key prefix for groups, e.g. "account" or "material". Default "account". */
  groupsKeyPrefix?: string;
  /** i18n key for delete action in list, e.g. "account.actions.delete". Required when groupsKeyPrefix is custom. */
  deleteActionKey?: string;
};

export function GroupSettingsDialog({
  open,
  onOpenChange,
  editableGroups,
  newGroupName,
  onNewGroupNameChange,
  onCreateGroup,
  editingGroupId,
  editingGroupName,
  onEditingGroupNameChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDeleteGroup,
  t,
  groupsKeyPrefix = "account",
  deleteActionKey = "account.actions.delete",
}: GroupSettingsDialogProps) {
  const gt = (suffix: string) => t(`${groupsKeyPrefix}.groups.${suffix}`);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={gt("close")}
        className="min-w-[320px] max-w-[480px] min-h-[200px] max-h-[85vh] overflow-hidden flex flex-col"
      >
        <DialogHeader className="pr-8">
          <DialogTitle>{gt("dialogTitle")}</DialogTitle>
          <DialogDescription>{gt("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => onNewGroupNameChange(e.target.value)}
              placeholder={gt("newGroupPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreateGroup();
              }}
            />
            <Button onClick={onCreateGroup}>{gt("createNew")}</Button>
          </div>

          <div className="min-h-[140px] max-h-[360px] overflow-y-auto space-y-2 flex flex-col">
            {editableGroups.length === 0 ? (
              <div className="flex flex-1 min-h-[140px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{gt("empty")}</p>
                <p>{gt("emptyHint")}</p>
              </div>
            ) : (
              editableGroups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  {editingGroupId === g.id ? (
                    <>
                      <Input
                        value={editingGroupName}
                        onChange={(e) =>
                          onEditingGroupNameChange(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onSaveRename();
                          if (e.key === "Escape") onCancelRename();
                        }}
                        autoFocus
                      />
                      <div className="ml-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onSaveRename}
                        >
                          {gt("confirm")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onCancelRename}
                        >
                          {gt("cancel")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>{g.name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-7 px-0 no-underline hover:no-underline"
                          onClick={() => onStartRename(g)}
                        >
                          {gt("rename")}
                        </Button>
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="link"
                                size="sm"
                                className="h-7 px-0 text-destructive hover:text-destructive/90 no-underline hover:no-underline"
                              >
                                {t(deleteActionKey)}
                              </Button>
                            }
                          />
                          <PopoverContent side="top" align="end">
                            <p className="text-sm">{gt("deleteConfirm")}</p>
                            <div className="mt-3 flex justify-end gap-2">
                              <PopoverClose
                                render={
                                  <Button variant="outline" size="sm">
                                    {gt("cancel")}
                                  </Button>
                                }
                              />
                              <PopoverClose
                                render={
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDeleteGroup(g.id)}
                                  >
                                    {gt("confirm")}
                                  </Button>
                                }
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
