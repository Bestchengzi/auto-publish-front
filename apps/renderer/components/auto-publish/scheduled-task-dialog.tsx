"use client";

import * as React from "react";
import Image from "next/image";
import {
  ChevronDownIcon,
  GraduationCapIcon,
  LightbulbIcon,
  WandSparklesIcon,
  ZapIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { listAccounts, type AccountResponse } from "@/lib/api/accounts";
import { listAccountGroupsWithCounts } from "@/lib/api/account-groups";
import { listTopicCenterBoards } from "@/lib/api/data-connectors";
import { listModelsCatalog } from "@/lib/api/models-catalog";
import { listPersonas } from "@/lib/api/personas";
import { getApiErrorMessage } from "@/lib/request";
import {
  createScheduledPublishTask,
  optimizeScheduledPublishPrompt,
  updateScheduledPublishTask,
  type ScheduledPublishOptimizePromptResponse,
  type PublishTargetsMap,
  type ScheduledPublishImageSource,
  type ScheduledPublishPlatform,
  type ScheduledPublishReasoningMode,
  type ScheduledPublishTaskResponse,
  type ScheduledPublishTopicSourceBinding,
  SCHEDULED_PUBLISH_PLATFORM_IDS,
} from "@/lib/api/scheduled-publish";
import { getPlatformLogoPath } from "@/lib/platforms";
import type { PlatformId } from "@/lib/platforms";

const NONE_PERSONA = "__none__";
const NONE_IMAGE_SOURCE = "__none__";

const JITTER_MINUTES = [0, 10, 20, 30, 60, 120] as const;
const IMAGE_SOURCE_OPTIONS = [
  "ai_generate",
  "web_search",
  "media_library",
] as const;
const REASONING_MODE_OPTIONS = ["flash", "thinking", "pro"] as const;

type ScheduledDialogFieldErrors = {
  name?: string;
  prompt?: string;
  accounts?: string;
  scheduleText?: string;
};

type TopicSourceOption = {
  value: string;
  label: string;
  avatarUrl?: string | null;
};

function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-500" aria-hidden>
      *
    </span>
  );
}

/** 与聊天区发布面板一致：不占文档流，避免表单项随提示出现/消失上下跳动 */
function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p
      id={id}
      className="pointer-events-none absolute top-full left-0 z-10 mt-1 max-w-full text-xs text-red-500"
      role="alert"
    >
      {message}
    </p>
  );
}

function pickModelSelect(
  models: { name: string }[],
  taskModelName: string | null | undefined,
): string {
  if (models.length === 0) return "";
  const trimmed = taskModelName?.trim();
  if (trimmed && models.some((m) => m.name === trimmed)) return trimmed;
  return models[0]!.name;
}

function isScheduledPlatform(p: string): p is ScheduledPublishPlatform {
  return SCHEDULED_PUBLISH_PLATFORM_IDS.includes(p as ScheduledPublishPlatform);
}

function collectAccountIdsFromTargets(targets: PublishTargetsMap): string[] {
  const ids: string[] = [];
  for (const v of Object.values(targets ?? {})) {
    if (v && Array.isArray(v.account_ids)) {
      ids.push(...v.account_ids);
    }
  }
  return [...new Set(ids)];
}

function buildPublishTargetsFromAccountIds(
  accountIds: string[],
  accountsById: Map<string, AccountResponse>,
): Record<string, { account_ids: string[] }> {
  const byPlatform = new Map<ScheduledPublishPlatform, string[]>();
  for (const id of accountIds) {
    const acc = accountsById.get(id);
    if (!acc || !isScheduledPlatform(acc.platform)) continue;
    const list = byPlatform.get(acc.platform) ?? [];
    list.push(id);
    byPlatform.set(acc.platform, list);
  }
  const out: Record<string, { account_ids: string[] }> = {};
  for (const [k, v] of byPlatform) {
    if (v.length) out[k] = { account_ids: v };
  }
  return out;
}

function extractOptimizedPrompt(
  response: ScheduledPublishOptimizePromptResponse,
): string | null {
  if (typeof response === "string") {
    return response.trim() || null;
  }
  const direct =
    response.optimized_prompt ?? response.prompt ?? response.content ?? null;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }
  const nested = response.data;
  const nestedValue =
    nested?.optimized_prompt ?? nested?.prompt ?? nested?.content ?? null;
  if (typeof nestedValue === "string" && nestedValue.trim()) {
    return nestedValue.trim();
  }
  return null;
}

function getResolvedReasoningMode(
  mode: ScheduledPublishReasoningMode | undefined,
  supportsThinking: boolean | undefined,
): ScheduledPublishReasoningMode {
  if (supportsThinking === false && mode !== "flash") {
    return "flash";
  }
  return mode ?? "flash";
}

function getReasoningModeFromTask(
  task: ScheduledPublishTaskResponse | null,
): ScheduledPublishReasoningMode {
  if (task?.is_plan_mode) {
    return "pro";
  }
  if (task?.thinking_enabled) {
    return "thinking";
  }
  return "flash";
}

function getReasoningPayload(mode: ScheduledPublishReasoningMode) {
  return {
    thinking_enabled: mode !== "flash",
    is_plan_mode: mode === "pro",
    reasoning_effort:
      mode === "pro" ? "medium" : mode === "thinking" ? "low" : "minimal",
  } as const;
}

export function ScheduledTaskDialog({
  open,
  onOpenChange,
  mode,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  task: ScheduledPublishTaskResponse | null;
}) {
  const t = useTranslations("autoPublish");
  const tInputBox = useTranslations("langgraph.inputBox");
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [prompt, setPrompt] = React.useState("");
  const [scheduleText, setScheduleText] = React.useState("");
  const [imageSource, setImageSource] =
    React.useState<ScheduledPublishImageSource | null>("web_search");
  const [platformFilter, setPlatformFilter] = React.useState<
    ScheduledPublishPlatform | "all"
  >("all");
  const [groupFilter, setGroupFilter] = React.useState<string>("all");
  const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>(
    [],
  );
  const [selectedTopicSourceValues, setSelectedTopicSourceValues] = React.useState<string[]>(
    [],
  );
  const [modelSelect, setModelSelect] = React.useState<string>("");
  const [reasoningMode, setReasoningMode] =
    React.useState<ScheduledPublishReasoningMode>("flash");
  const [jitterMinutes, setJitterMinutes] = React.useState<number>(0);
  const [scheduleEnabled, setScheduleEnabled] = React.useState(true);
  const [personaId, setPersonaId] = React.useState<string>(NONE_PERSONA);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [fieldErrors, setFieldErrors] =
    React.useState<ScheduledDialogFieldErrors>({});
  const [touchedFields, setTouchedFields] = React.useState<
    Partial<Record<keyof ScheduledDialogFieldErrors, boolean>>
  >({});

  const clearFieldError = React.useCallback(
    (key: keyof ScheduledDialogFieldErrors) => {
      setFieldErrors((prev) => {
        if (prev[key] == null) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const timezone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const groupsQuery = useQuery({
    queryKey: ["scheduled-task-dialog", "account-groups"],
    queryFn: listAccountGroupsWithCounts,
    enabled: open,
    staleTime: 60 * 1000,
  });

  const accountsQuery = useQuery({
    queryKey: [
      "scheduled-task-dialog",
      "accounts",
      platformFilter,
      groupFilter,
    ] as QueryKey,
    queryFn: async () => {
      let groupIdParam: number | null = null;
      if (groupFilter !== "all" && groupFilter !== "ungrouped") {
        const n = parseInt(groupFilter, 10);
        if (!Number.isNaN(n)) groupIdParam = n;
      }
      const res = await listAccounts({
        platforms:
          platformFilter === "all" ? undefined : platformFilter,
        group_id: groupIdParam,
      });
      let items = res.items.filter((a) => isScheduledPlatform(a.platform));
      if (groupFilter === "ungrouped") {
        items = items.filter((a) => !a.groups?.length);
      }
      return items;
    },
    enabled: open,
    staleTime: 30 * 1000,
  });

  /** 全量列表：用于已选账号展示 / 组平台映射；与左侧筛选无关，避免筛走已选项后丢昵称或丢平台信息 */
  const accountsForEditLabelsQuery = useQuery({
    queryKey: ["scheduled-task-dialog", "accounts-all-labels"],
    queryFn: async () => {
      const res = await listAccounts({});
      return res.items.filter((a) => isScheduledPlatform(a.platform));
    },
    enabled: open,
    staleTime: 60 * 1000,
  });

  const modelsQuery = useQuery({
    queryKey: ["scheduled-task-dialog", "models"],
    queryFn: listModelsCatalog,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const personasQuery = useQuery({
    queryKey: ["scheduled-task-dialog", "personas"],
    queryFn: listPersonas,
    enabled: open,
    staleTime: 60 * 1000,
  });

  const boardsQuery = useQuery<TopicSourceOption[]>({
    queryKey: ["scheduled-task-dialog", "topic-center-boards"],
    queryFn: async () =>
      (await listTopicCenterBoards()).items.map((item) => ({
        value: item.board_id,
        label: item.title,
        avatarUrl: item.icon_url,
      })),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const accountsById = React.useMemo(() => {
    const m = new Map<string, AccountResponse>();
    for (const a of accountsForEditLabelsQuery.data ?? []) {
      m.set(a.id, a);
    }
    for (const a of accountsQuery.data ?? []) {
      m.set(a.id, a);
    }
    return m;
  }, [accountsQuery.data, accountsForEditLabelsQuery.data]);

  const accountOptions = React.useMemo(
    () =>
      (accountsQuery.data ?? []).map((a) => ({
        value: a.id,
        label: a.nickname || a.account,
        avatarUrl: a.avatar,
        trailingLogoUrl: getPlatformLogoPath(a.platform as PlatformId),
      })),
    [accountsQuery.data],
  );

  const topicSourceOptionByValue = React.useMemo(
    () => new Map((boardsQuery.data ?? []).map((item) => [item.value, item])),
    [boardsQuery.data],
  );

  const boardOptions = React.useMemo(
    () =>
      (boardsQuery.data ?? []).map((board) => ({
        value: board.value,
        label: board.label,
        avatarUrl: board.avatarUrl,
      })),
    [boardsQuery.data],
  );

  const resolveAccountLabel = React.useCallback(
    (id: string) => {
      const a = accountsById.get(id);
      return a ? (a.nickname || a.account) : undefined;
    },
    [accountsById],
  );

  const resolveSelectedAvatar = React.useCallback(
    (id: string) => accountsById.get(id)?.avatar ?? undefined,
    [accountsById],
  );

  const resolveBoardLabel = React.useCallback(
    (id: string) => topicSourceOptionByValue.get(id)?.label,
    [topicSourceOptionByValue],
  );

  const resolveBoardAvatar = React.useCallback(
    (id: string) => topicSourceOptionByValue.get(id)?.avatarUrl ?? undefined,
    [topicSourceOptionByValue],
  );

  const validateField = React.useCallback(
    (
      key: keyof ScheduledDialogFieldErrors,
      accountIds: string[] = selectedAccountIds,
    ) => {
      if (key === "name") {
        return name.trim() ? undefined : t("dialog.validation.name");
      }
      if (key === "prompt") {
        return prompt.trim() ? undefined : t("dialog.validation.prompt");
      }
      if (key === "scheduleText") {
        return scheduleText.trim()
          ? undefined
          : t("dialog.validation.scheduleText");
      }
      if (key === "accounts") {
        return Object.keys(
          buildPublishTargetsFromAccountIds(accountIds, accountsById),
        ).length > 0
          ? undefined
          : t("dialog.validation.accounts");
      }
      return undefined;
    },
    [accountsById, name, prompt, scheduleText, selectedAccountIds, t],
  );

  const handleFieldBlur = React.useCallback(
    (key: keyof ScheduledDialogFieldErrors) => {
      setTouchedFields((prev) => ({ ...prev, [key]: true }));
      const message = validateField(key);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (message) next[key] = message;
        else delete next[key];
        return next;
      });
    },
    [validateField],
  );

  React.useEffect(() => {
    if (!open) return;
    const currentTask = mode === "edit" ? task : null;
    setName(currentTask?.name ?? "");
    setPrompt(currentTask?.prompt ?? "");
    setScheduleText(
      currentTask?.schedule_text?.trim()
        ? currentTask.schedule_text
        : (currentTask?.schedule?.expression ?? ""),
    );
    setImageSource(currentTask?.image_source ?? "web_search");
    setScheduleEnabled(currentTask?.schedule_enabled ?? true);
    setJitterMinutes(
      JITTER_MINUTES.includes(
        (currentTask?.jitter_minutes ?? 0) as (typeof JITTER_MINUTES)[number],
      )
        ? (currentTask?.jitter_minutes ?? 0)
        : 0,
    );
    setPersonaId(currentTask?.persona_id ?? NONE_PERSONA);
    setPlatformFilter("all");
    setGroupFilter("all");
    setSelectedAccountIds(
      currentTask
        ? collectAccountIdsFromTargets(currentTask.publish_targets)
        : [],
    );
    setSelectedTopicSourceValues(
      (currentTask?.topic_source_bindings ?? []).map(
        (binding) => binding.board_id,
      ),
    );
    setReasoningMode(
      currentTask ? getReasoningModeFromTask(currentTask) : "flash",
    );
    setAdvancedOpen(false);
    setFieldErrors({});
    setTouchedFields({});
  }, [mode, open, task]);

  /** 模型目录就绪后设置选中项：新建默认第一项；编辑沿用任务模型（无效则第一项）。不依赖本 effect 重置其它表单字段。 */
  React.useEffect(() => {
    if (!open) return;
    const models = modelsQuery.data?.models ?? [];
    if (models.length === 0) {
      setModelSelect("");
      setReasoningMode("flash");
      return;
    }
    if (mode === "edit" && task) {
      setModelSelect(pickModelSelect(models, task.model_name));
    } else {
      setModelSelect(models[0]!.name);
    }
  }, [open, mode, task, modelsQuery.data?.models]);

  const selectedModel = React.useMemo(() => {
    const models = modelsQuery.data?.models ?? [];
    if (models.length === 0) return undefined;
    return models.find((m) => m.name === modelSelect) ?? models[0];
  }, [modelSelect, modelsQuery.data?.models]);

  const supportThinking = selectedModel?.supports_thinking !== false;

  React.useEffect(() => {
    const nextMode = getResolvedReasoningMode(
      reasoningMode,
      selectedModel?.supports_thinking,
    );
    if (nextMode !== reasoningMode) {
      setReasoningMode(nextMode);
    }
  }, [reasoningMode, selectedModel?.supports_thinking]);

  const handleSaveSuccess = React.useCallback(
    (message: string) => {
      toast.success(message);
      void queryClient.invalidateQueries({
        queryKey: ["auto-publish", "tasks"],
      });
      onOpenChange(false);
    },
    [onOpenChange, queryClient],
  );

  const handleSaveError = React.useCallback(
    (error: unknown) => {
      toast.error(getApiErrorMessage(error, t("toast.saveFailed")));
    },
    [t],
  );

  const createMutation = useMutation({
    mutationFn: createScheduledPublishTask,
    onSuccess: () => handleSaveSuccess(t("toast.createSuccess")),
    onError: handleSaveError,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateScheduledPublishTask>[1];
    }) => updateScheduledPublishTask(id, body),
    onSuccess: () => handleSaveSuccess(t("toast.updateSuccess")),
    onError: handleSaveError,
  });

  const optimizePromptMutation = useMutation({
    mutationFn: optimizeScheduledPublishPrompt,
    onSuccess: (response) => {
      const nextPrompt = extractOptimizedPrompt(response);
      if (!nextPrompt) {
        toast.error(t("dialog.optimizePrompt.invalidResponse"));
        return;
      }
      setPrompt(nextPrompt);
      clearFieldError("prompt");
      toast.success(t("dialog.optimizePrompt.success"));
    },
    onError: (e) =>
      toast.error(
        getApiErrorMessage(e, t("dialog.optimizePrompt.failed")),
      ),
  });

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    optimizePromptMutation.isPending;

  function onSubmit() {
    const nextErrors: ScheduledDialogFieldErrors = {};
    const trimmedName = name.trim();
    const trimmedPrompt = prompt.trim();
    const trimmedScheduleText = scheduleText.trim();
    const publishTargets = buildPublishTargetsFromAccountIds(
      selectedAccountIds,
      accountsById,
    );
    const topicSourceBindings: ScheduledPublishTopicSourceBinding[] =
      selectedTopicSourceValues.map((value) => ({
        board_id: value,
        item_limit: 20,
      }));

    nextErrors.name = validateField("name");
    nextErrors.prompt = validateField("prompt");
    nextErrors.scheduleText = validateField("scheduleText");
    nextErrors.accounts = validateField("accounts");

    for (const key of Object.keys(nextErrors) as (keyof ScheduledDialogFieldErrors)[]) {
      if (!nextErrors[key]) {
        delete nextErrors[key];
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setTouchedFields((prev) => {
        const n = { ...prev };
        for (const k of Object.keys(nextErrors) as (keyof ScheduledDialogFieldErrors)[]) {
          n[k] = true;
        }
        return n;
      });
      return;
    }
    setFieldErrors({});

    const model_name = modelSelect.trim() || null;
    const persona_id = personaId === NONE_PERSONA ? null : personaId;
    const reasoningPayload = getReasoningPayload(reasoningMode);
    const commonPayload = {
      name: trimmedName,
      prompt: trimmedPrompt,
      image_source: imageSource,
      timezone,
      schedule_text: trimmedScheduleText,
      publish_targets: publishTargets,
      schedule_enabled: scheduleEnabled,
      jitter_minutes: jitterMinutes,
      ...reasoningPayload,
      ...(topicSourceBindings.length > 0
        ? { topic_source_bindings: topicSourceBindings }
        : {}),
    };

    if (mode === "create") {
      createMutation.mutate({
        ...commonPayload,
        persona_id: persona_id ?? undefined,
        ...(model_name ? { model_name } : {}),
      });
      return;
    }

    if (!task) return;
    updateMutation.mutate({
      id: task.id,
      body: {
        ...commonPayload,
        model_name,
        persona_id,
      },
    });
  }

  const reasoningModeOptions = React.useMemo(
    (): Array<{
      value: ScheduledPublishReasoningMode;
      label: string;
      description: string;
      icon: typeof ZapIcon;
    }> =>
      REASONING_MODE_OPTIONS.filter((value) =>
        supportThinking ? true : value === "flash",
      ).map((value) => {
        if (value === "flash") {
          return {
            value,
            label: tInputBox("flashMode"),
            description: tInputBox("flashModeDescription"),
            icon: ZapIcon,
          };
        }
        if (value === "thinking") {
          return {
            value,
            label: tInputBox("reasoningMode"),
            description: tInputBox("reasoningModeDescription"),
            icon: LightbulbIcon,
          };
        }
        return {
          value,
          label: tInputBox("proMode"),
          description: tInputBox("proModeDescription"),
          icon: GraduationCapIcon,
        };
      }),
    [supportThinking, tInputBox],
  );

  const selectedReasoningModeOption =
    reasoningModeOptions.find((option) => option.value === reasoningMode) ??
    reasoningModeOptions[0];

  const modelSummaryLabel =
    (selectedModel?.display_name ?? selectedModel?.name ?? modelSelect) || "—";
  const advancedSummary = `${modelSummaryLabel} · ${selectedReasoningModeOption?.label ?? tInputBox("flashMode")} · ${scheduleEnabled ? t("dialog.advanced.scheduleOn") : t("dialog.advanced.scheduleOff")} · ${t("dialog.advanced.jitterSummary", { minutes: jitterMinutes })}`;
  const reasoningModeFieldLabel = `${tInputBox("reasoningMode")}${/^[A-Za-z]/.test(
    tInputBox("reasoningMode"),
  )
    ? ` ${tInputBox("mode")}`
    : tInputBox("mode")}`;

  /** 不依赖 SelectValue 子函数（Base UI 下易退回显示原始 value），与账号页一致用手动文案 */
  const groupSelectDisplay = React.useMemo(() => {
    if (groupFilter === "all") return t("dialog.filters.allGroups");
    if (groupFilter === "ungrouped") return t("dialog.filters.ungrouped");
    const row = (groupsQuery.data?.items ?? []).find(
      (g) => g.group_id != null && String(g.group_id) === groupFilter,
    );
    return row?.group_name ?? groupFilter;
  }, [groupFilter, groupsQuery.data?.items, t]);

  const platformSelectDisplay = React.useMemo(() => {
    if (platformFilter === "all") return t("dialog.filters.allPlatforms");
    if (isScheduledPlatform(platformFilter)) {
      return t(`platforms.${platformFilter}`);
    }
    return String(platformFilter);
  }, [platformFilter, t]);

  const topicSourceBindingsLabel = t("dialog.fields.topicSourceBindings");
  const topicSourceBindingsPlaceholder = t(
    "dialog.placeholders.topicSourceBindings",
  );
  const topicSourceBindingsSearchPlaceholder = t(
    "dialog.placeholders.searchTopicSourceBindings",
  );
  const emptyTopicSourceBindingsText = t("dialog.emptyTopicSourceBindings");
  const imageSourceOptions = React.useMemo(
    () =>
      IMAGE_SOURCE_OPTIONS.map((value) => ({
        value,
        label: t(`dialog.imageSource.${value}`),
      })),
    [t],
  );

  function onOptimizePrompt() {
    const trimmedName = name.trim();
    const trimmedPrompt = prompt.trim();

    if (!trimmedName) {
      setTouchedFields((prev) => ({ ...prev, name: true }));
      setFieldErrors((prev) => ({
        ...prev,
        name: t("dialog.validation.name"),
      }));
      toast.error(t("dialog.optimizePrompt.needName"));
      return;
    }
    if (!trimmedPrompt) {
      setTouchedFields((prev) => ({ ...prev, prompt: true }));
      setFieldErrors((prev) => ({
        ...prev,
        prompt: t("dialog.validation.prompt"),
      }));
      toast.error(t("dialog.optimizePrompt.needPrompt"));
      return;
    }
    optimizePromptMutation.mutate({
      name: trimmedName,
      prompt: trimmedPrompt,
      persona_id: personaId === NONE_PERSONA ? null : personaId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={t("dialog.close")}
        className="flex max-h-[min(90vh,860px)] max-w-2xl flex-col gap-0 p-0"
      >
        <DialogHeader className="mb-0 shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>
            {mode === "create" ? t("dialog.titleCreate") : t("dialog.titleEdit")}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 max-h-[min(68vh,640px)] flex-1 overflow-y-auto px-6 pt-4 pb-8">
          <div className="space-y-7">
            <div className="space-y-2">
              <label
                htmlFor="st-name"
                className="block text-sm font-medium leading-none"
              >
                {t("dialog.fields.name")}
                <RequiredMark />
              </label>
              <div className="relative">
                <Input
                  id="st-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  onBlur={() => handleFieldBlur("name")}
                  placeholder={t("dialog.placeholders.name")}
                  aria-invalid={Boolean(
                    touchedFields.name && fieldErrors.name,
                  )}
                  aria-describedby={
                    touchedFields.name && fieldErrors.name
                      ? "st-name-error"
                      : undefined
                  }
                  className={cn(
                    "bg-muted/40",
                    touchedFields.name &&
                      fieldErrors.name &&
                      "border-destructive ring-1 ring-destructive/35",
                  )}
                />
                {touchedFields.name && fieldErrors.name ? (
                  <FieldError id="st-name-error" message={fieldErrors.name} />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium leading-none">
                {t("dialog.fields.persona")}
              </div>
              <Select
                value={personaId}
                onValueChange={(v) => setPersonaId(v ?? NONE_PERSONA)}
              >
                <SelectTrigger className="h-9 w-full bg-muted/40">
                  <SelectValue placeholder={t("dialog.placeholders.persona")}>
                    {(value) => {
                      if (value == null || value === "") return null;
                      if (value === NONE_PERSONA) {
                        return t("dialog.personaNone");
                      }
                      const p = (personasQuery.data?.items ?? []).find(
                        (x) => x.id === value,
                      );
                      if (p) {
                        return `${p.name} (${p.platform})`;
                      }
                      return value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_PERSONA}>
                    {t("dialog.personaNone")}
                  </SelectItem>
                  {(personasQuery.data?.items ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.platform})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="st-prompt"
                  className="block text-sm font-medium leading-none"
                >
                  {t("dialog.fields.prompt")}
                  <RequiredMark />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOptimizePrompt}
                  disabled={optimizePromptMutation.isPending}
                  className="h-7 px-2.5 text-xs"
                >
                  <WandSparklesIcon className="mr-1 size-3.5" />
                  {optimizePromptMutation.isPending
                    ? t("dialog.optimizePrompt.loading")
                    : t("dialog.optimizePrompt.action")}
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  id="st-prompt"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    clearFieldError("prompt");
                  }}
                  onBlur={() => handleFieldBlur("prompt")}
                  placeholder={t("dialog.placeholders.prompt")}
                  resizeMode="vertical"
                  aria-invalid={Boolean(
                    touchedFields.prompt && fieldErrors.prompt,
                  )}
                  aria-describedby={
                    touchedFields.prompt && fieldErrors.prompt
                      ? "st-prompt-error"
                      : undefined
                  }
                  className={cn(
                    "min-h-[120px] bg-muted/40",
                    touchedFields.prompt &&
                      fieldErrors.prompt &&
                      "border-destructive ring-1 ring-destructive/35",
                  )}
                />
                {touchedFields.prompt && fieldErrors.prompt ? (
                  <FieldError
                    id="st-prompt-error"
                    message={fieldErrors.prompt}
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium leading-none">
                {t("dialog.fields.publishTargets")}
                <RequiredMark />
              </div>
              <div className="flex min-w-0 gap-2">
                <div className="min-w-0 max-w-[11rem] flex-[0.75] sm:max-w-none">
                  <Select
                    value={platformFilter}
                    onValueChange={(v) => {
                      setPlatformFilter(
                        (v ?? "all") as ScheduledPublishPlatform | "all",
                      );
                      clearFieldError("accounts");
                    }}
                  >
                    <SelectTrigger className="h-9 w-full bg-muted/40">
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm">
                        {platformFilter !== "all" &&
                        isScheduledPlatform(platformFilter) ? (
                          <Image
                            src={getPlatformLogoPath(platformFilter as PlatformId)}
                            alt=""
                            width={16}
                            height={16}
                            className="size-4 shrink-0 rounded-sm object-contain"
                          />
                        ) : null}
                        <span className="truncate">{platformSelectDisplay}</span>
                      </span>
                      <SelectValue className="sr-only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("dialog.filters.allPlatforms")}</SelectItem>
                      {SCHEDULED_PUBLISH_PLATFORM_IDS.map((id) => (
                        <SelectItem key={id} value={id}>
                          <span className="inline-flex items-center gap-2">
                            <Image
                              src={getPlatformLogoPath(id as PlatformId)}
                              alt=""
                              width={16}
                              height={16}
                              className="size-4 rounded-sm object-contain"
                            />
                            {t(`platforms.${id}`)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 max-w-[11rem] flex-[0.75] sm:max-w-none">
                  <Select
                    value={groupFilter}
                    onValueChange={(v) => {
                      setGroupFilter(v ?? "all");
                      clearFieldError("accounts");
                    }}
                  >
                    <SelectTrigger className="h-9 w-full bg-muted/40">
                      <span className="min-w-0 flex-1 truncate text-left text-sm">
                        {groupSelectDisplay}
                      </span>
                      <SelectValue className="sr-only" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t("dialog.fields.group")}</SelectLabel>
                        <SelectItem value="all">
                          {t("dialog.filters.allGroups")}
                        </SelectItem>
                        <SelectItem value="ungrouped">
                          {t("dialog.filters.ungrouped")}
                        </SelectItem>
                        {(groupsQuery.data?.items ?? [])
                          .filter((g) => g.group_id != null)
                          .map((g) => (
                            <SelectItem
                              key={g.group_id as number}
                              value={String(g.group_id)}
                            >
                              {g.group_name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative min-w-0 flex-[1.5]">
                  <MultiSelect
                    options={accountOptions}
                    values={selectedAccountIds}
                    onValuesChange={(v) => {
                      setSelectedAccountIds(v);
                      if (touchedFields.accounts) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          const nextAccountsError = validateField(
                            "accounts",
                            v,
                          );
                          if (nextAccountsError) {
                            next.accounts = nextAccountsError;
                          } else {
                            delete next.accounts;
                          }
                          return next;
                        });
                      } else {
                        clearFieldError("accounts");
                      }
                    }}
                    resolveSelectedLabel={resolveAccountLabel}
                    resolveSelectedAvatar={resolveSelectedAvatar}
                    placeholder={t("dialog.placeholders.accounts")}
                    searchPlaceholder={t("dialog.placeholders.searchAccounts")}
                    emptyText={t("dialog.emptyAccounts")}
                    onBlur={() => handleFieldBlur("accounts")}
                    className={cn(
                      "h-9 w-full bg-muted/40",
                      touchedFields.accounts &&
                        fieldErrors.accounts &&
                        "border-destructive ring-1 ring-destructive/35",
                    )}
                  />
                  {touchedFields.accounts && fieldErrors.accounts ? (
                    <FieldError
                      id="st-accounts-error"
                      message={fieldErrors.accounts}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="st-schedule-text"
                className="block text-sm font-medium leading-none"
              >
                {t("dialog.fields.scheduleText")}
                <RequiredMark />
              </label>
              <div className="relative">
                <Input
                  id="st-schedule-text"
                  value={scheduleText}
                  onChange={(e) => {
                    setScheduleText(e.target.value);
                    clearFieldError("scheduleText");
                  }}
                  onBlur={() => handleFieldBlur("scheduleText")}
                  placeholder={t("dialog.placeholders.scheduleText")}
                  aria-invalid={Boolean(
                    touchedFields.scheduleText && fieldErrors.scheduleText,
                  )}
                  aria-describedby={
                    touchedFields.scheduleText && fieldErrors.scheduleText
                      ? "st-schedule-text-error"
                      : undefined
                  }
                  className={cn(
                    "bg-muted/40 text-sm",
                    touchedFields.scheduleText &&
                      fieldErrors.scheduleText &&
                      "border-destructive ring-1 ring-destructive/35",
                  )}
                />
                {touchedFields.scheduleText && fieldErrors.scheduleText ? (
                  <FieldError
                    id="st-schedule-text-error"
                    message={fieldErrors.scheduleText}
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium leading-none">
                {t("dialog.fields.imageSource")}
              </div>
              <Select
                value={imageSource ?? NONE_IMAGE_SOURCE}
                onValueChange={(v) =>
                  setImageSource(
                    v === NONE_IMAGE_SOURCE
                      ? null
                      : ((v ?? "web_search") as ScheduledPublishImageSource),
                  )
                }
              >
                <SelectTrigger className="h-9 w-full bg-muted/40">
                  <SelectValue>
                    {(value) => {
                      if (value == null || value === "") return null;
                      if (value === NONE_IMAGE_SOURCE) {
                        return t("dialog.imageSource.none");
                      }
                      const key = value as ScheduledPublishImageSource;
                      return (
                        imageSourceOptions.find((option) => option.value === key)
                          ?.label ?? value
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_IMAGE_SOURCE}>
                    {t("dialog.imageSource.none")}
                  </SelectItem>
                  {imageSourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {boardOptions.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium leading-none">
                  {topicSourceBindingsLabel}
                </div>
                <MultiSelect
                  options={boardOptions}
                  values={selectedTopicSourceValues}
                  onValuesChange={setSelectedTopicSourceValues}
                  resolveSelectedLabel={resolveBoardLabel}
                  resolveSelectedAvatar={resolveBoardAvatar}
                  placeholder={topicSourceBindingsPlaceholder}
                  searchPlaceholder={topicSourceBindingsSearchPlaceholder}
                  emptyText={emptyTopicSourceBindingsText}
                  className="h-9 w-full bg-muted/40"
                />
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-border bg-muted/15">
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    {t("dialog.advanced.title")}
                  </span>
                  <span className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
                    <span className="truncate text-right text-sm text-muted-foreground">
                      {advancedSummary}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        advancedOpen && "rotate-180",
                      )}
                    />
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <div className="space-y-5 border-t border-border bg-muted/25 px-4 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {t("dialog.advanced.scheduleEnabled")}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t("dialog.advanced.scheduleEnabledDesc")}
                        </p>
                      </div>
                      <div className="flex shrink-0 justify-start sm:justify-end">
                        <Switch
                          checked={scheduleEnabled}
                          onCheckedChange={setScheduleEnabled}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {t("dialog.advanced.model")}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t("dialog.advanced.modelDesc")}
                        </p>
                      </div>
                      <div className="w-full shrink-0 sm:w-64 sm:max-w-[50%]">
                        <Select
                          value={modelSelect}
                          onValueChange={(v) => {
                            if (v) setModelSelect(v);
                          }}
                        >
                          <SelectTrigger
                            className="h-9 w-full border-0 bg-background/80 shadow-none ring-1 ring-border/60"
                            disabled={(modelsQuery.data?.models ?? []).length === 0}
                          >
                            <SelectValue>
                              {(value) => {
                                if (value == null || value === "") return null;
                                const m = (modelsQuery.data?.models ?? []).find(
                                  (x) => x.name === value,
                                );
                                return m?.display_name ?? m?.name ?? value;
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(modelsQuery.data?.models ?? []).map((m) => (
                              <SelectItem key={m.name} value={m.name}>
                                {m.display_name || m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {reasoningModeFieldLabel}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {selectedReasoningModeOption?.description}
                        </p>
                      </div>
                      <div className="w-full shrink-0 sm:w-64 sm:max-w-[50%]">
                        <Select
                          value={reasoningMode}
                          onValueChange={(value) => {
                            if (
                              value === "flash" ||
                              value === "thinking" ||
                              value === "pro"
                            ) {
                              setReasoningMode(
                                getResolvedReasoningMode(
                                  value,
                                  selectedModel?.supports_thinking,
                                ),
                              );
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 w-full border-0 bg-background/80 shadow-none ring-1 ring-border/60">
                            <SelectValue>
                              {(value) => {
                                if (value == null || value === "") return null;
                                const option = reasoningModeOptions.find(
                                  (item) => item.value === value,
                                );
                                if (!option) return value;
                                const Icon = option.icon;
                                return (
                                  <span className="inline-flex items-center gap-2">
                                    <Icon className="size-4 text-muted-foreground" />
                                    <span>{option.label}</span>
                                  </span>
                                );
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {reasoningModeOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <span className="inline-flex items-center gap-2">
                                    <Icon className="size-4 text-muted-foreground" />
                                    {option.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {t("dialog.advanced.jitter")}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t("dialog.advanced.jitterDesc")}
                        </p>
                      </div>
                      <div className="w-full shrink-0 sm:w-64 sm:max-w-[50%]">
                        <Select
                          value={String(jitterMinutes)}
                          onValueChange={(v) =>
                            setJitterMinutes(Number(v ?? "0"))
                          }
                        >
                          <SelectTrigger className="h-9 w-full border-0 bg-background/80 shadow-none ring-1 ring-border/60">
                            <SelectValue>
                              {(value) => {
                                if (value == null || value === "") return null;
                                const n = Number(value);
                                if (
                                  JITTER_MINUTES.includes(
                                    n as (typeof JITTER_MINUTES)[number],
                                  )
                                ) {
                                  return t(`dialog.jitter.${n}` as "dialog.jitter.0");
                                }
                                return value;
                              }}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {JITTER_MINUTES.map((m) => (
                              <SelectItem key={m} value={String(m)}>
                                {t(`dialog.jitter.${m}` as "dialog.jitter.0")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-0 shrink-0 border-t border-border px-6 py-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("dialog.cancel")}
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending ? t("dialog.saving") : t("dialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
