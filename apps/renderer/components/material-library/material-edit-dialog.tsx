"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Material, MaterialType, Group } from "./types";
import { formatFileSize } from "./utils";

type MaterialEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  groups: Group[];
  typeLabels: Record<MaterialType, string>;
  onSave: (
    id: string,
    updates: {
      name: string;
      groupId: string | null;
      tags: string[];
      description?: string | null;
    },
  ) => void;
  closeLabel: string;
  cancelLabel: string;
  titleLabel: string;
  nameLabel: string;
  groupLabel: string;
  descriptionLabel: string;
  ungroupedLabel: string;
  typeLabel: string;
  tagsLabel: string;
  uploadedAtLabel: string;
  fileSizeLabel: string;
  saveLabel: string;
  documentPreviewNotSupported: string;
  imagePreviewPlaceholder: string;
  videoPreviewPlaceholder: string;
};

function parseTags(tagsStr: string): string[] {
  return tagsStr
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function MaterialEditDialog({
  open,
  onOpenChange,
  material,
  groups,
  typeLabels,
  onSave,
  closeLabel,
  cancelLabel,
  titleLabel,
  nameLabel,
  groupLabel,
  descriptionLabel,
  ungroupedLabel,
  typeLabel,
  tagsLabel,
  uploadedAtLabel,
  fileSizeLabel,
  saveLabel,
  documentPreviewNotSupported,
  imagePreviewPlaceholder,
  videoPreviewPlaceholder,
}: MaterialEditDialogProps) {
  const [name, setName] = React.useState("");
  const [groupId, setGroupId] = React.useState<string>("ungrouped");
  const [tagsStr, setTagsStr] = React.useState("");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (material) {
      setName(material.name);
      setGroupId(material.groupId ?? "ungrouped");
      setTagsStr(material.tags.join("、"));
      setDescription(material.description ?? "");
    }
  }, [material]);

  const editableGroups = groups.filter(
    (g) => g.id !== "all" && g.id !== "ungrouped",
  );
  const groupOptions = React.useMemo(() => {
    const opts = [...editableGroups];
    if (
      material?.groupId &&
      material.groupId !== "ungrouped" &&
      material.groupName &&
      !opts.some((g) => g.id === material.groupId)
    ) {
      opts.push({ id: material.groupId, name: material.groupName });
    }
    opts.push({ id: "ungrouped", name: ungroupedLabel });
    return opts;
  }, [editableGroups, ungroupedLabel, material?.groupId, material?.groupName]);

  function handleSave() {
    if (!material) return;
    onSave(material.id, {
      name: name.trim() || material.name,
      groupId: groupId === "ungrouped" ? null : groupId,
      tags: parseTags(tagsStr),
      description: description.trim() || null,
    });
    onOpenChange(false);
  }

  if (!material) return null;

  const isDocument = material.type === "document";
  const isVideo = material.type === "video";
  const previewContent = isDocument ? (
    <span className="text-sm text-muted-foreground">
      {documentPreviewNotSupported}
    </span>
  ) : material.previewUrl && material.type === "image" ? (
    /* eslint-disable-next-line @next/next/no-img-element -- blob URL */
    <img
      src={material.previewUrl}
      alt={material.name}
      className="min-w-0 max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
    />
  ) : material.previewUrl && material.type === "video" ? (
    <video
      src={material.previewUrl}
      muted
      playsInline
      controls
      preload="metadata"
      className="min-w-0 max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
    />
  ) : (
    <span className="text-sm text-muted-foreground">
      {isVideo ? videoPreviewPlaceholder : imagePreviewPlaceholder}
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={closeLabel}
        className="max-w-4xl w-full min-w-[800px] p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <DialogHeader className="px-6 pt-4 pb-1 pr-12">
          <DialogTitle>{titleLabel}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row min-h-[360px] max-h-[calc(100vh-11rem)] border-t border-border">
          {/* 左侧：文件预览 - 绝对定位使图片不参与行高计算，行高完全由右侧表单决定，左右同高 */}
          <div className="relative flex flex-1 min-w-0 min-h-0 flex-col border-r border-border overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50">
                {previewContent}
              </div>
            </div>
          </div>

          {/* 右侧：编辑信息 - 主导行高，移除 overflow 避免滚动条，内容自然撑开 */}
          <div className="flex flex-1 min-w-0 flex-col overflow-visible p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="material-name"
                  className="block text-sm font-medium leading-none"
                >
                  {nameLabel}
                </label>
                <Input
                  id="material-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium leading-none">
                  {groupLabel}
                </label>
                <div className="w-full">
                  <Select
                    value={groupId}
                    onValueChange={(v) => setGroupId(v ?? "ungrouped")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) =>
                          groupOptions.find((g) => g.id === value)?.name ??
                          (material && material.groupId === value
                            ? material.groupName
                            : null) ??
                          value ??
                          ungroupedLabel
                        }
                      </SelectValue>
                    </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium leading-none">
                  {typeLabel}
                </label>
                <Input
                  value={typeLabels[material.type]}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="material-tags"
                  className="block text-sm font-medium leading-none"
                >
                  {tagsLabel}
                </label>
                <Input
                  id="material-tags"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="时政、军事、国防"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="material-description"
                  className="block text-sm font-medium leading-none"
                >
                  {descriptionLabel}
                </label>
                <textarea
                  id="material-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground placeholder:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder=""
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/50 px-3 py-3 flex items-center justify-between gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 shrink-0">
                <span>{uploadedAtLabel}</span>
                <span className="text-foreground">{material.uploadedAt}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span>{fileSizeLabel}</span>
                <span className="text-foreground">
                  {formatFileSize(material.sizeBytes)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {cancelLabel}
              </Button>
              <Button onClick={handleSave}>{saveLabel}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
