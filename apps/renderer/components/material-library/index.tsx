"use client";

import * as React from "react";
import { useRef } from "react";
import { debounce } from "lodash";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  LayoutGridIcon,
  Rows3Icon,
  MoreHorizontalIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { GroupSidebar } from "@/components/account-management/group-sidebar";
import { BulkBar } from "@/components/account-management/bulk-bar";
import { GroupSettingsDialog } from "@/components/account-management/group-settings-dialog";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";

import type { MaterialType, Group, Material } from "./types";
import { formatFileSize } from "./utils";
import * as mediaApi from "@/lib/api/media";
import * as mediaGroupsApi from "@/lib/api/media-groups";
import { getApiErrorMessage } from "@/lib/request";
import { formatDateTime } from "@/lib/date";
import { MaterialCard } from "./material-card";
import { MaterialEmptyState } from "./material-empty-state";
import { MaterialEditDialog } from "./material-edit-dialog";
import { MaterialLibrarySkeleton } from "./material-library-skeleton";
import { cn } from "@/lib/utils";

const MATERIAL_TYPES: { id: MaterialType; nameKey: string }[] = [
  { id: "image", nameKey: "material.types.image" },
  { id: "video", nameKey: "material.types.video" },
  { id: "document", nameKey: "material.types.document" },
];

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico",
  ".mp4", ".webm", ".ogg",
  ".pdf", ".doc", ".docx", ".txt", ".md", ".xls", ".xlsx",
]);

function isAllowedFile(file: File): boolean {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return true;
  const m = file.type.toLowerCase();
  if (m.startsWith("image/")) return true;
  return false;
}

function mapMediaResponseToMaterial(m: mediaApi.MediaResponse): Material {
  const groupId =
    m.groups?.[0]?.id != null ? String(m.groups[0].id) : null;
  const groupName = m.groups?.[0]?.name ?? null;
  return {
    id: m.id,
    name: m.name,
    type: m.media_type as MaterialType,
    tags: m.tags ?? [],
    groupId,
    groupName,
    sizeBytes: m.file_size ?? 0,
    uploadedAt: formatDateTime(m.created_at),
    description: m.remark ?? undefined,
    previewUrl:
      m.media_type === "image" || m.media_type === "video"
        ? mediaApi.getMediaDownloadUrl(m.id)
        : undefined,
  };
}

export function MaterialLibrary() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [groupSettingsOpen, setGroupSettingsOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );
  const [pendingBatchDeleteOpen, setPendingBatchDeleteOpen] =
    React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(
    null,
  );
  const [editingGroupName, setEditingGroupName] = React.useState("");

  const [view, setView] = React.useState<"table" | "card">("card");
  const [queryInput, setQueryInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<MaterialType | "all">(
    "all",
  );
  const [groupFilter, setGroupFilter] = React.useState<string>("all");

  const updateQuery = React.useMemo(
    () => debounce((next: string) => setQuery(next), 300),
    [],
  );
  React.useEffect(() => () => updateQuery.cancel(), [updateQuery]);
  const groupsQuery = useQuery({
    queryKey: ["material-library", "groups", t("material.groups.all")] as QueryKey,
    queryFn: async () => {
      const res = await mediaGroupsApi.listMediaGroupsWithCounts();
      const list: Group[] = [
        { id: "all", name: t("material.groups.all") },
        { id: "ungrouped", name: t("material.groups.ungrouped") },
      ];
      const counts: Record<string, number> = { all: 0, ungrouped: 0 };
      for (const item of res.items) {
        counts.all += item.count;
        if (item.group_id == null) {
          counts.ungrouped = item.count;
        } else {
          list.push({ id: String(item.group_id), name: item.group_name });
          counts[String(item.group_id)] = item.count;
        }
      }
      return { list, counts };
    },
  });

  const materialsQuery = useQuery({
    queryKey: [
      "material-library",
      "materials",
      query,
      typeFilter,
      groupFilter,
    ] as QueryKey,
    queryFn: async () => {
      let groupIdParam: number | null | undefined = undefined;
      if (groupFilter === "ungrouped") groupIdParam = null;
      else if (groupFilter !== "all") {
        const n = parseInt(groupFilter, 10);
        if (!Number.isNaN(n)) groupIdParam = n;
      }
      const res = await mediaApi.listMedia({
        name: query || undefined,
        media_type:
          typeFilter === "all"
            ? undefined
            : (typeFilter as mediaApi.MediaType),
        group_id: groupIdParam,
      });
      let items = res.items.map(mapMediaResponseToMaterial);
      if (groupFilter === "ungrouped") {
        items = items.filter((m) => m.groupId == null || m.groupId === "ungrouped");
      }
      return items;
    },
    // Keep previous list during filter refetch to avoid empty-state flicker.
    placeholderData: (previousData) => previousData,
  });

  const groups = groupsQuery.data?.list ?? [];
  const groupCounts = groupsQuery.data?.counts ?? { all: 0, ungrouped: 0 };
  const materials = materialsQuery.data;
  const editableGroups = groups.filter(
    (g) => g.id !== "all" && g.id !== "ungrouped",
  );
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  React.useEffect(() => {
    if (!hasLoadedOnce && groupsQuery.isFetched && materialsQuery.isFetched) {
      setHasLoadedOnce(true);
    }
  }, [groupsQuery.isFetched, hasLoadedOnce, materialsQuery.isFetched]);

  const isInitialLoading =
    !hasLoadedOnce && (groupsQuery.isLoading || materialsQuery.isLoading);

  const fetchGroups = React.useCallback(async () => {
    try {
      await groupsQuery.refetch();
    } catch (e) {
      console.error("Failed to fetch media groups:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }, [groupsQuery, t]);

  const refreshData = React.useCallback(async () => {
    try {
      await Promise.all([groupsQuery.refetch(), materialsQuery.refetch()]);
    } catch (e) {
      console.error("Failed to refresh material data:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }, [groupsQuery, materialsQuery, t]);

  const invalidateMaterialLibraryQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["material-library"] });
  }, [queryClient]);

  async function createGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    try {
      await mediaGroupsApi.createMediaGroup(name);
      setNewGroupName("");
      await invalidateMaterialLibraryQueries();
      await fetchGroups();
    } catch (e) {
      console.error("Failed to create group:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }

  function startRename(g: Group) {
    setEditingGroupId(g.id);
    setEditingGroupName(g.name);
  }

  function saveRename() {
    if (!editingGroupId) return;
    toast.error(t("material.groups.renameNotSupported"));
    setEditingGroupId(null);
    setEditingGroupName("");
  }

  function cancelRename() {
    setEditingGroupId(null);
    setEditingGroupName("");
  }

  async function deleteGroup(groupId: string) {
    if (groupId === "all" || groupId === "ungrouped") return;
    const numId = parseInt(groupId, 10);
    if (Number.isNaN(numId)) return;
    try {
      await mediaGroupsApi.deleteMediaGroup(numId);
      await invalidateMaterialLibraryQueries();
      await refreshData();
    } catch (e) {
      console.error("Failed to delete group:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }

  const filteredMaterials = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (materials ?? []).filter((m) => {
      const passQuery = !q || m.name.toLowerCase().includes(q);
      const passType = typeFilter === "all" || m.type === typeFilter;
      const gid = m.groupId ?? "ungrouped";
      const passGroup = groupFilter === "all" || gid === groupFilter;
      return passQuery && passType && passGroup;
    });
  }, [materials, groupFilter, query, typeFilter]);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(filteredMaterials.map((m) => m.id));
      const next = new Set<string>();
      for (const id of prev) if (allowed.has(id)) next.add(id);
      return next;
    });
  }, [filteredMaterials]);

  const allSelected =
    filteredMaterials.length > 0 &&
    selectedIds.size === filteredMaterials.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleOne(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  function toggleAll(next: boolean) {
    setSelectedIds(
      next ? new Set(filteredMaterials.map((m) => m.id)) : new Set(),
    );
  }

  async function moveSelectedToGroup(targetGroupId: string) {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const groupId =
      targetGroupId === "ungrouped"
        ? null
        : parseInt(targetGroupId, 10);
    try {
      await mediaApi.moveMediaToGroup(
        ids,
        targetGroupId === "ungrouped" || Number.isNaN(groupId)
          ? null
          : groupId,
      );
      setSelectedIds(new Set());
      await invalidateMaterialLibraryQueries();
      await refreshData();
    } catch (e) {
      console.error("Failed to move media:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      await mediaApi.deleteMedia(ids);
      setSelectedIds(new Set());
      await invalidateMaterialLibraryQueries();
      await refreshData();
    } catch (e) {
      console.error("Failed to delete media:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }

  async function deleteOne(id: string) {
    try {
      await mediaApi.deleteMedia([id]);
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      setEditingMaterial((prev) => (prev?.id === id ? null : prev));
      await invalidateMaterialLibraryQueries();
      await refreshData();
    } catch (e) {
      console.error("Failed to delete media:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }

  async function updateMaterial(
    id: string,
    updates: {
      name: string;
      groupId: string | null;
      tags: string[];
      description?: string | null;
    },
  ) {
    try {
      const groupIds =
        updates.groupId && updates.groupId !== "ungrouped"
          ? [parseInt(updates.groupId, 10)]
          : [];
      await mediaApi.editMedia(id, {
        name: updates.name,
        tags: updates.tags,
        remark: updates.description ?? null,
        group_ids: updates.groupId === "ungrouped" ? [] : groupIds,
      });
      await invalidateMaterialLibraryQueries();
      await refreshData();
    } catch (e) {
      console.error("Failed to update media:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const validFiles = Array.from(files).filter(isAllowedFile);
    const rejectedCount = files.length - validFiles.length;
    if (rejectedCount > 0) {
      toast.error(t("material.upload.invalidType", { count: rejectedCount }));
    }
    if (!validFiles.length) return;
    const targetGroupId =
      groupFilter === "all" || groupFilter === "ungrouped" ? null : groupFilter;
    try {
      const uploadedIds: string[] = [];
      for (const file of validFiles) {
        const res = await mediaApi.uploadMedia(file);
        uploadedIds.push(res.id);
      }
      if (
        targetGroupId &&
        uploadedIds.length > 0 &&
        !Number.isNaN(parseInt(targetGroupId, 10))
      ) {
        await mediaApi.moveMediaToGroup(
          uploadedIds,
          parseInt(targetGroupId, 10),
        );
      }
      await invalidateMaterialLibraryQueries();
      await refreshData();
    } catch (e) {
      console.error("Failed to upload media:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }

  const typeLabels: Record<MaterialType, string> = {
    image: t("material.types.image"),
    video: t("material.types.video"),
    document: t("material.types.document"),
  };

  return (
    <div className="w-full h-full">
      <div className="h-full rounded-xl p-8 px-16 flex flex-col">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "table" | "card")}
          className="flex flex-1 min-h-0 flex-col gap-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xl font-semibold tracking-tight">
                {t("material.title")}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("material.description")}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <div className="w-full sm:w-64">
                <Input
                  value={queryInput}
                  onChange={(e) => {
                    setQueryInput(e.target.value);
                    updateQuery(e.target.value);
                  }}
                  placeholder={t("material.search.placeholder")}
                  aria-label={t("material.search.ariaLabel")}
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as MaterialType | "all")}
              >
                <SelectTrigger className="gap-1.5" size="default">
                  <span className="text-muted-foreground">
                    {t("material.filters.type")}
                  </span>
                  <span className="font-medium">
                    {typeFilter === "all"
                      ? t("material.filters.all")
                      : typeLabels[typeFilter as MaterialType]}
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="end" className="w-44">
                  <SelectGroup>
                    <SelectLabel>{t("material.filters.type")}</SelectLabel>
                    <SelectItem value="all">
                      {t("material.filters.all")}
                    </SelectItem>
                    {MATERIAL_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {t(type.nameKey)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <TabsList className="hidden sm:flex rounded-lg border border-border p-1">
                <TabsTrigger value="card" className="gap-1.5">
                  <LayoutGridIcon className="size-4" />
                  {t("material.view.card")}
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-1.5">
                  <Rows3Icon className="size-4" />
                  {t("material.view.table")}
                </TabsTrigger>
              </TabsList>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,video/ogg,.pdf,.doc,.docx,.txt,.md,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon className="size-4" />
                {t("material.actions.upload")}
              </Button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch">
            {isInitialLoading ? (
              <MaterialLibrarySkeleton />
            ) : (
              <>
            <GroupSidebar
              groups={groups}
              groupFilter={groupFilter}
              groupCounts={groupCounts}
              onGroupFilterChange={setGroupFilter}
              onSettingsClick={() => setGroupSettingsOpen(true)}
              title={t("material.groups.title")}
              settingsTooltip={t("material.groups.settingsTooltip")}
            />

            <div className="min-w-0 flex-1 rounded-xl border border-border flex flex-col min-h-0 lg:self-stretch">
              <BulkBar
                selectedCount={selectedIds.size}
                groups={groups}
                onMoveToGroup={moveSelectedToGroup}
                onDeleteSelected={() => setPendingBatchDeleteOpen(true)}
                selectedCountLabel={t("material.bulk.selectedCount", {
                  count: selectedIds.size,
                })}
                moveToGroupLabel={t("material.bulk.moveToGroup")}
                batchDeleteLabel={t("material.actions.batchDelete")}
              />
              <TabsContent
                value="table"
                className="flex flex-1 min-h-0 flex-col mt-0"
              >
                <div className="w-full flex flex-col min-h-0 flex-1">
                  <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                    {filteredMaterials.length > 0 ? (
                      <Table
                        bodyScroll
                        className="min-w-[860px] table-fixed"
                      >
                        <TableHeader
                          className={cn(
                            "[&_tr]:border-border [&_th]:h-[47px] [&_th]:py-0 [&_tr]:py-0",
                            selectedIds.size > 0
                              ? "[&_tr]:bg-background"
                              : "[&_tr]:bg-muted/40",
                          )}
                        >
                          <TableRow
                            className={
                              selectedIds.size > 0
                                ? "hover:bg-background"
                                : "hover:bg-muted/40"
                            }
                          >
                            <TableHead className="w-12 shrink-0 px-4">
                              <Checkbox
                                aria-label={t("material.table.selectAll")}
                                checked={allSelected}
                                indeterminate={someSelected}
                                onCheckedChange={(v) => toggleAll(Boolean(v))}
                              />
                            </TableHead>
                            <TableHead className="w-52 min-w-0">
                              {t("material.table.name")}
                            </TableHead>
                            <TableHead className="w-24 shrink-0">
                              {t("material.table.type")}
                            </TableHead>
                            <TableHead className="w-32 shrink-0">
                              {t("material.table.tags")}
                            </TableHead>
                            <TableHead className="w-28 shrink-0">
                              {t("material.table.group")}
                            </TableHead>
                            <TableHead className="w-24 shrink-0">
                              {t("material.table.size")}
                            </TableHead>
                            <TableHead className="w-36 shrink-0">
                              {t("material.table.uploadedAt")}
                            </TableHead>
                            <TableHead className="w-12 shrink-0 text-right">
                              <span className="sr-only">
                                {t("material.table.actions")}
                              </span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMaterials.map((m) => {
                            const groupName =
                              m.groupId === null
                                ? "--"
                                : (() => {
                                    const g = groups.find(
                                      (gr) => gr.id === m.groupId,
                                    );
                                    return g ? g.name : "--";
                                  })();
                            const checked = selectedIds.has(m.id);
                            return (
                              <TableRow key={m.id}>
                                <TableCell className="w-12 shrink-0 px-4">
                                  <Checkbox
                                    aria-label={t("material.table.selectOne")}
                                    checked={checked}
                                    onCheckedChange={(v) =>
                                      toggleOne(m.id, Boolean(v))
                                    }
                                  />
                                </TableCell>
                                <TableCell className="w-52 min-w-0">
                                  <div className="min-w-0 truncate text-sm">
                                    {m.name}
                                  </div>
                                </TableCell>
                                <TableCell className="w-24 shrink-0">
                                  <span className="text-sm">
                                    {typeLabels[m.type]}
                                  </span>
                                </TableCell>
                                <TableCell className="w-32 shrink-0 min-w-0">
                                  <div className="flex min-w-0 flex-wrap gap-1">
                                    {m.tags.length > 0 ? (
                                      m.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex max-w-full truncate rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground ring-1 ring-border"
                                        >
                                          {tag}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="w-28 shrink-0 min-w-0">
                                  <span className="block min-w-0 truncate">
                                    {groupName}
                                  </span>
                                </TableCell>
                                <TableCell className="w-24 shrink-0">
                                  {formatFileSize(m.sizeBytes)}
                                </TableCell>
                                <TableCell className="w-36 shrink-0">
                                  {m.uploadedAt}
                                </TableCell>
                                <TableCell className="w-12 shrink-0 text-right">
                                  <div className="flex items-center justify-end">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger
                                        render={
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            aria-label={t(
                                              "material.table.actions",
                                            )}
                                          >
                                            <MoreHorizontalIcon className="size-4" />
                                          </Button>
                                        }
                                      />
                                      <DropdownMenuContent
                                        align="end"
                                        className="w-36"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => setEditingMaterial(m)}
                                        >
                                          <PencilIcon className="size-4" />
                                          {t("material.actions.edit")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() =>
                                            setPendingDeleteId(m.id)
                                          }
                                        >
                                          <Trash2Icon className="size-4" />
                                          {t("material.actions.delete")}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex min-h-full w-full flex-1 items-center justify-center p-8">
                        <MaterialEmptyState
                          title={t("material.emptyTitle")}
                          description={t("material.emptyDescription")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent
                value="card"
                className="flex flex-1 min-h-0 flex-col mt-0"
              >
                <div className="flex flex-1 min-h-0 flex-col overflow-auto p-5">
                  {filteredMaterials.length > 0 ? (
                    <>
                      <div
                        className={cn(
                          "flex h-12 min-h-12 shrink-0 items-center gap-2 rounded-t-xl border-b border-border px-4 text-sm transition-colors -mx-5 -mt-5 mb-4",
                          selectedIds.size > 0
                            ? "bg-background"
                            : "bg-muted/40",
                        )}
                      >
                        <Checkbox
                          aria-label={t("material.table.selectAll")}
                          checked={allSelected}
                          indeterminate={someSelected}
                          onCheckedChange={(v) => toggleAll(Boolean(v))}
                        />
                        <span
                          className="cursor-pointer text-foreground font-medium"
                          onClick={() => toggleAll(!allSelected)}
                        >
                          {t("material.table.selectAll")}
                        </span>
                      </div>
                      <div className="grid gap-4 grid-cols-4">
                        {filteredMaterials.map((m) => {
                          const checked = selectedIds.has(m.id);
                          return (
                            <MaterialCard
                              key={m.id}
                              material={m}
                              checked={checked}
                              onCheckedChange={(v) => toggleOne(m.id, v)}
                              onEdit={() => setEditingMaterial(m)}
                              onDelete={() => setPendingDeleteId(m.id)}
                              editLabel={t("material.actions.edit")}
                              deleteLabel={t("material.actions.delete")}
                              documentPreviewNotSupported={t(
                                "material.card.documentPreviewNotSupported",
                              )}
                              imagePreviewPlaceholder={t(
                                "material.card.imagePreviewPlaceholder",
                              )}
                              videoPreviewPlaceholder={t(
                                "material.card.videoPreviewPlaceholder",
                              )}
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[200px] flex-1 items-center justify-center">
                      <MaterialEmptyState
                        title={t("material.emptyTitle")}
                        description={t("material.emptyDescription")}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
              </>
            )}
          </div>
        </Tabs>

        <DeleteConfirmDialog
          open={pendingDeleteId !== null}
          onOpenChange={(open) => !open && setPendingDeleteId(null)}
          onConfirm={() => {
            if (pendingDeleteId) {
              deleteOne(pendingDeleteId);
              setPendingDeleteId(null);
            }
          }}
          closeLabel={t("material.groups.close")}
          title={t("material.actions.delete")}
          description={t("material.actions.deleteMaterialConfirm")}
          cancelLabel={t("material.groups.cancel")}
          confirmLabel={t("material.groups.confirm")}
        />

        <DeleteConfirmDialog
          open={pendingBatchDeleteOpen}
          onOpenChange={setPendingBatchDeleteOpen}
          onConfirm={() => {
            deleteSelected();
            setPendingBatchDeleteOpen(false);
          }}
          closeLabel={t("material.groups.close")}
          title={t("material.actions.batchDelete")}
          description={t("material.actions.batchDeleteConfirm", {
            count: selectedIds.size,
          })}
          cancelLabel={t("material.groups.cancel")}
          confirmLabel={t("material.groups.confirm")}
        />

        <MaterialEditDialog
          open={editingMaterial !== null}
          onOpenChange={(open) => !open && setEditingMaterial(null)}
          material={editingMaterial}
          groups={groups}
          typeLabels={typeLabels}
          onSave={updateMaterial}
          closeLabel={t("material.groups.close")}
          cancelLabel={t("material.groups.cancel")}
          titleLabel={t("material.edit.title")}
          nameLabel={t("material.table.name")}
          groupLabel={t("material.edit.group")}
          descriptionLabel={t("material.edit.description")}
          ungroupedLabel={t("material.groups.ungrouped")}
          typeLabel={t("material.edit.type")}
          tagsLabel={t("material.table.tags")}
          uploadedAtLabel={t("material.edit.uploadedAt")}
          fileSizeLabel={t("material.edit.fileSize")}
          saveLabel={t("material.edit.save")}
          documentPreviewNotSupported={t(
            "material.card.documentPreviewNotSupported",
          )}
          imagePreviewPlaceholder={t("material.card.imagePreviewPlaceholder")}
          videoPreviewPlaceholder={t("material.card.videoPreviewPlaceholder")}
        />

        <GroupSettingsDialog
          open={groupSettingsOpen}
          onOpenChange={setGroupSettingsOpen}
          editableGroups={editableGroups}
          newGroupName={newGroupName}
          onNewGroupNameChange={setNewGroupName}
          onCreateGroup={createGroup}
          editingGroupId={editingGroupId}
          editingGroupName={editingGroupName}
          onEditingGroupNameChange={setEditingGroupName}
          onStartRename={startRename}
          onSaveRename={saveRename}
          onCancelRename={cancelRename}
          onDeleteGroup={deleteGroup}
          t={t}
          groupsKeyPrefix="material"
          deleteActionKey="material.actions.delete"
        />
      </div>
    </div>
  );
}

export type { MaterialType, Group, Material } from "./types";
