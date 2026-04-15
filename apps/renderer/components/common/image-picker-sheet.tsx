"use client";

import { CheckIcon, Loader2Icon, PlusIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { PageEmptyState } from "@/components/common/page-empty-state";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ImagePickerItem = {
  id: string | number;
  name: string;
  url: string;
};

type ImagePickerLibraryTab = {
  key: string;
  label: string;
  items: ImagePickerItem[];
  selectedUrls: string[];
  onToggleItem: (url: string) => void;
  isFetching?: boolean;
  isItemDisabled?: (url: string) => boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

type ImagePickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: string;
  onTabChange: (tab: string) => void;
  uploadSlot?: ReactNode;
  uploadCandidates: string[];
  isUploading?: boolean;
  onClickUpload: () => void;
  onClickUploadCandidate?: (index: number) => void;
  showUploadContinue?: boolean;
  onClickUploadContinue?: () => void;
  uploadTabLabel?: string;
  libraryTabLabel?: string;
  uploadLocalLabel?: string;
  uploadingLabel?: string;
  reuploadLabel?: string;
  uploadContinueLabel?: string;
  libraryLoadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  libraryItems: ImagePickerItem[];
  selectedLibraryUrls: string[];
  onToggleLibraryItem: (url: string) => void;
  isFetchingLibrary?: boolean;
  isLibraryItemDisabled?: (url: string) => boolean;
  maxSelectHint: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  extraLibraryTabs?: ImagePickerLibraryTab[];
  libraryToolbar?: (tabKey: string) => ReactNode;
};

export function ImagePickerSheet({
  open,
  onOpenChange,
  tab,
  onTabChange,
  uploadSlot,
  uploadCandidates,
  isUploading = false,
  onClickUpload,
  onClickUploadCandidate,
  showUploadContinue = false,
  onClickUploadContinue,
  uploadTabLabel = "上传图片",
  libraryTabLabel = "我的素材",
  uploadLocalLabel = "本地上传",
  uploadingLabel = "上传中...",
  reuploadLabel = "重新上传",
  uploadContinueLabel = "继续上传",
  libraryLoadingLabel = "素材加载中...",
  emptyTitle = "暂无图片素材",
  emptyDescription = "请先在素材库中上传图片素材。",
  libraryItems,
  selectedLibraryUrls,
  onToggleLibraryItem,
  isFetchingLibrary = false,
  isLibraryItemDisabled,
  maxSelectHint,
  cancelLabel = "取消",
  confirmLabel = "确认",
  confirmDisabled = false,
  onConfirm,
  extraLibraryTabs = [],
  libraryToolbar,
}: ImagePickerSheetProps) {
  const libraryTabs: ImagePickerLibraryTab[] = [
    ...extraLibraryTabs,
    {
      key: "library",
      label: libraryTabLabel,
      items: libraryItems,
      selectedUrls: selectedLibraryUrls,
      onToggleItem: onToggleLibraryItem,
      isFetching: isFetchingLibrary,
      isItemDisabled: isLibraryItemDisabled,
      loadingLabel: libraryLoadingLabel,
      emptyTitle,
      emptyDescription,
    },
  ];
  const activeLibraryTab = libraryTabs.find((item) => item.key === tab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" maxWidth="860px" className="p-0">
        <div className="flex h-full min-h-0 flex-col px-8 pt-6 pb-5">
          <Tabs
            value={tab}
            onValueChange={(v) => onTabChange(v as "upload" | "library")}
            className="min-h-0 flex-1"
          >
            <TabsList variant="line" className="h-auto w-full justify-start p-0">
              <TabsTrigger value="upload" className="h-9 px-1.5 text-base">
                {uploadTabLabel}
              </TabsTrigger>
              {libraryTabs.map((item) => (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  className="h-9 px-1.5 text-base"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tab === "upload" ? (
              <div className="mt-6 min-h-0 flex-1 overflow-auto pr-8 -mr-8">
                {uploadSlot}
                {uploadCandidates.length === 0 ? (
                  <div className="flex h-full min-h-[420px] items-center justify-center">
                    <Button
                      type="button"
                      className="h-10 px-10 text-base"
                      onClick={onClickUpload}
                      disabled={isUploading}
                    >
                      <PlusIcon className="size-5" />
                      {isUploading ? uploadingLabel : uploadLocalLabel}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {uploadCandidates.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-muted"
                        onClick={() =>
                          onClickUploadCandidate ? onClickUploadCandidate(idx) : onClickUpload()
                        }
                      >
                        <Image
                          src={url}
                          alt={`uploaded-${idx + 1}`}
                          width={300}
                          height={230}
                          unoptimized
                          className="aspect-[150/115] w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex flex-col items-center gap-1.5 text-white">
                            <PlusIcon className="size-7" />
                            <span className="text-base font-medium">{reuploadLabel}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {showUploadContinue && (
                      <button
                        type="button"
                        className="flex aspect-[150/115] w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40"
                        onClick={onClickUploadContinue ?? onClickUpload}
                        disabled={isUploading}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <PlusIcon className="size-5" />
                          <span className="text-sm">
                            {isUploading ? uploadingLabel : uploadContinueLabel}
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 min-h-0 flex-1 overflow-auto pr-8 -mr-8">
                {activeLibraryTab ? libraryToolbar?.(activeLibraryTab.key) : null}
                {activeLibraryTab?.isFetching ? (
                  <div className="flex min-h-full items-center justify-center pr-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2Icon className="size-4 animate-spin" />
                      <span>{activeLibraryTab.loadingLabel ?? libraryLoadingLabel}</span>
                    </div>
                  </div>
                ) : (activeLibraryTab?.items.length ?? 0) === 0 ? (
                  <div className="flex min-h-full items-center justify-center pr-8">
                    <PageEmptyState
                      title={activeLibraryTab?.emptyTitle ?? emptyTitle}
                      description={
                        activeLibraryTab?.emptyDescription ?? emptyDescription
                      }
                    />
                  </div>
                ) : (
                  <div className="columns-2 gap-3 md:columns-3">
                    {activeLibraryTab?.items.map((item) => {
                      const selected =
                        activeLibraryTab.selectedUrls.includes(item.url);
                      const disabled =
                        activeLibraryTab.isItemDisabled?.(item.url) ?? false;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "group relative mb-3 break-inside-avoid cursor-pointer overflow-hidden rounded-lg border bg-muted",
                            selected
                              ? "border-primary ring-2 ring-primary/40"
                              : "border-border",
                            disabled && "cursor-not-allowed opacity-60",
                          )}
                          onClick={() => {
                            if (disabled) return;
                            activeLibraryTab.onToggleItem(item.url);
                          }}
                        >
                          <Image
                            src={item.url}
                            alt={item.name}
                            width={800}
                            height={600}
                            unoptimized
                            className="h-auto w-full object-cover"
                          />
                          <div
                            className={cn(
                              "pointer-events-none absolute inset-0 transition-colors",
                              selected ? "bg-black/20" : "bg-black/0 group-hover:bg-black/15",
                            )}
                          />
                          <div
                            className={cn(
                              "pointer-events-none absolute top-3 left-3 flex size-7 items-center justify-center rounded-full border transition-all",
                              selected
                                ? "border-primary bg-primary text-primary-foreground opacity-100"
                                : "border-white/85 bg-black/30 text-transparent opacity-0 backdrop-blur-[1px] group-hover:opacity-100",
                            )}
                          >
                            <CheckIcon className="size-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Tabs>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">{maxSelectHint}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-5 text-base"
                onClick={() => onOpenChange(false)}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-10 px-5 text-base"
                disabled={confirmDisabled}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
