"use client";

import type { AccountResponse } from "@/lib/api/accounts";
import type {
  PublishTargetsMap,
  ScheduledPublishImageSource,
  ScheduledPublishOptimizePromptResponse,
  ScheduledPublishPlatform,
  ScheduledPublishReasoningMode,
  ScheduledPublishTaskResponse,
} from "@/lib/api/scheduled-publish";
import { SCHEDULED_PUBLISH_PLATFORM_IDS } from "@/lib/api/scheduled-publish";

export const NONE_PERSONA = "__none__";
export const NONE_IMAGE_SOURCE = "__none__";

export const JITTER_MINUTES = [0, 10, 20, 30, 60, 120] as const;
export const IMAGE_SOURCE_OPTIONS = [
  "ai_generate",
  "web_search",
  "media_library",
] as const satisfies readonly ScheduledPublishImageSource[];
export const REASONING_MODE_OPTIONS = ["flash", "thinking", "pro"] as const;

export type ScheduledDialogFieldErrors = {
  name?: string;
  prompt?: string;
  accounts?: string;
  scheduleText?: string;
};

export type TopicSourceOption = {
  value: string;
  label: string;
  avatarUrl?: string | null;
};

export function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-500" aria-hidden>
      *
    </span>
  );
}

export function FieldError({ id, message }: { id?: string; message: string }) {
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

export function pickModelSelect(
  models: { name: string }[],
  taskModelName: string | null | undefined,
): string {
  if (models.length === 0) return "";
  const trimmed = taskModelName?.trim();
  if (trimmed && models.some((model) => model.name === trimmed)) return trimmed;
  return models[0]!.name;
}

export function isScheduledPlatform(platform: string): platform is ScheduledPublishPlatform {
  return SCHEDULED_PUBLISH_PLATFORM_IDS.includes(platform as ScheduledPublishPlatform);
}

export function collectAccountIdsFromTargets(targets: PublishTargetsMap): string[] {
  const ids: string[] = [];

  for (const value of Object.values(targets ?? {})) {
    if (value && Array.isArray(value.account_ids)) {
      ids.push(...value.account_ids);
    }
  }

  return [...new Set(ids)];
}

export function buildPublishTargetsFromAccountIds(
  accountIds: string[],
  accountsById: Map<string, AccountResponse>,
): Record<string, { account_ids: string[] }> {
  const byPlatform = new Map<ScheduledPublishPlatform, string[]>();

  for (const id of accountIds) {
    const account = accountsById.get(id);
    if (!account || !isScheduledPlatform(account.platform)) continue;

    const existing = byPlatform.get(account.platform) ?? [];
    existing.push(id);
    byPlatform.set(account.platform, existing);
  }

  const result: Record<string, { account_ids: string[] }> = {};

  for (const [platform, ids] of byPlatform) {
    if (ids.length > 0) {
      result[platform] = { account_ids: ids };
    }
  }

  return result;
}

export function extractOptimizedPrompt(
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

export function getResolvedReasoningMode(
  mode: ScheduledPublishReasoningMode | undefined,
  supportsThinking: boolean | undefined,
): ScheduledPublishReasoningMode {
  if (supportsThinking === false && mode !== "flash") {
    return "flash";
  }
  return mode ?? "flash";
}

export function getReasoningModeFromTask(
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

export function getReasoningPayload(mode: ScheduledPublishReasoningMode) {
  return {
    thinking_enabled: mode !== "flash",
    is_plan_mode: mode === "pro",
    reasoning_effort:
      mode === "pro" ? "medium" : mode === "thinking" ? "low" : "minimal",
  } as const;
}
