"use client";

import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ImageIcon,
  ImageOffIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePublishFlow } from "@/components/publish";
import type { PublishEditResponse } from "@/lib/api/publish";
import {
  createThreadImageTask,
  downloadThreadImageTask,
  getThreadImageTask,
  listThreadImageTasks,
  type ImageTaskItemResponse,
  type ImageTaskPrompt,
  type ImageTaskResponse,
  type ImageTaskStatus,
} from "@/lib/api/image-tasks";
import { getApiErrorData, getApiErrorMessage } from "@/lib/request";
import { cn, getGenImageUrl } from "@/lib/utils";

export type RednotePrompt = {
  title: string;
  text: string;
};

export type RednoteContent = {
  title: string;
  content: string;
  prompts: RednotePrompt[];
};

type EditableRednoteContent = RednoteContent;

type PromptImageHistoryItem = {
  uid: string;
  title: string | null;
  prompt: string;
  status: ImageTaskStatus;
  url: string | null;
  error: unknown;
  taskId: string;
  taskCreatedAt: string;
  updatedAt: string;
};

type ImageTaskSubmissionPrompt = ImageTaskPrompt & {
  index: number;
};

const IMAGE_TASK_POLL_INTERVAL_MS = 2000;
const PENDING_IMAGE_TASK_ID = "__pending_image_task__";

type InsufficientBalanceInfo = {
  message: string;
  availablePoints?: number;
  requiredPoints?: number;
};

function createPromptUid(index: number): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `rednote-p${index + 1}-${random}`;
}

function getPromptTaskTitle(prompt: RednotePrompt | undefined, index: number) {
  return prompt?.title.trim() || (index === 0 ? "封面" : "内容");
}

function isTerminalImageStatus(status: ImageTaskStatus): boolean {
  return status === "completed" || status === "failed";
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function extractInsufficientBalanceInfo(
  root: unknown,
): InsufficientBalanceInfo | null {
  const visited = new WeakSet<object>();
  const queue: unknown[] = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (visited.has(node)) continue;
    visited.add(node);

    const candidate = node as Record<string, unknown>;
    const detail = candidate.detail;
    const code =
      typeof candidate.code === "string"
        ? candidate.code
        : typeof candidate.error_code === "string"
          ? candidate.error_code
          : "";
    const message =
      typeof candidate.message === "string"
        ? candidate.message
        : typeof detail === "string"
          ? detail
          : "";

    if (
      code === "insufficient_balance" ||
      code === "BILLING_INSUFFICIENT_BALANCE"
    ) {
      return {
        message: message.trim() || "账户余额不足，请先充值后再试。",
        availablePoints: readNumber(candidate.available_points),
        requiredPoints: readNumber(candidate.required_points),
      };
    }

    if (detail && typeof detail === "object") {
      queue.push(detail);
    }

    for (const value of Object.values(candidate)) {
      if (value && typeof value === "object") {
        queue.push(value);
      }
      if (
        typeof value === "string" &&
        value.includes("BILLING_INSUFFICIENT_BALANCE")
      ) {
        return {
          message: "账户余额不足，请先充值后再试。",
        };
      }
    }
  }

  return null;
}

function ImageGenerationLoading() {
  return (
    <div className="relative h-full min-h-[330px] w-full overflow-hidden rounded-md bg-gradient-to-br from-muted/85 via-muted/50 to-muted/75">
      <motion.div
        className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-[#ff2442]/20 blur-2xl"
        animate={{
          x: [0, 18, 0],
          y: [0, 14, 0],
          opacity: [0.28, 0.68, 0.28],
        }}
        transition={{
          duration: 1.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="pointer-events-none absolute -right-12 -bottom-12 size-36 rounded-full bg-foreground/15 blur-2xl"
        animate={{
          x: [0, -14, 0],
          y: [0, -16, 0],
          opacity: [0.18, 0.44, 0.18],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute size-12 rounded-full border border-foreground/35"
          animate={{
            scale: [0.85, 1.45],
            opacity: [0.45, 0],
          }}
          transition={{
            duration: 1.25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
        <motion.div
          animate={{
            y: [0, -3, 0],
            scale: [0.96, 1.1, 0.96],
            opacity: [0.4, 0.5, 0.4],
          }}
          transition={{
            duration: 1.1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <ImageIcon className="size-9 text-foreground/70" />
        </motion.div>
      </div>
    </div>
  );
}

function ImageGenerationFailed() {
  return (
    <div className="flex h-full min-h-[330px] w-full flex-col items-center justify-center gap-1.5 rounded-md bg-destructive/5 px-2 text-center">
      <ImageOffIcon
        className="size-8 shrink-0 text-destructive/75"
        aria-hidden
      />
      <span className="line-clamp-2 text-xs font-medium text-destructive/90">
        生成失败
      </span>
    </div>
  );
}

export function normalizeRednoteContent(value: unknown): RednoteContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const title = typeof candidate.title === "string" ? candidate.title : "";
  const content =
    typeof candidate.content === "string" ? candidate.content : "";
  const prompts = Array.isArray(candidate.prompts)
    ? candidate.prompts
        .map((item): RednotePrompt | null => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return null;
          }
          const prompt = item as Record<string, unknown>;
          return {
            title: typeof prompt.title === "string" ? prompt.title : "",
            text: typeof prompt.text === "string" ? prompt.text : "",
          };
        })
        .filter((item): item is RednotePrompt => item !== null)
    : [];

  if (!title && !content && prompts.length === 0) {
    return null;
  }

  return { title, content, prompts };
}

function createEditableContent(
  rednoteContent: RednoteContent | null,
): EditableRednoteContent {
  return {
    title: rednoteContent?.title ?? "",
    content: rednoteContent?.content ?? "",
    prompts: rednoteContent?.prompts ?? [],
  };
}

function imageTaskItemToHistoryItem(
  task: ImageTaskResponse,
  item: ImageTaskItemResponse,
): PromptImageHistoryItem {
  return {
    uid: item.uid,
    title: item.title ?? null,
    prompt: item.prompt,
    status: item.status,
    url: item.url,
    error: item.error,
    taskId: task.id,
    taskCreatedAt: task.created_at,
    updatedAt: item.updated_at,
  };
}

function createPendingHistoryItem(
  prompt: ImageTaskPrompt,
  timestamp: string,
): PromptImageHistoryItem {
  return {
    uid: prompt.uid,
    title: prompt.title ?? null,
    prompt: prompt.prompt,
    status: "queued",
    url: null,
    error: null,
    taskId: PENDING_IMAGE_TASK_ID,
    taskCreatedAt: timestamp,
    updatedAt: timestamp,
  };
}

function removeIndexedRecordItem<T>(
  record: Record<number, T>,
  targetIndex: number,
): Record<number, T> {
  const next: Record<number, T> = {};
  for (const [indexText, value] of Object.entries(record)) {
    const index = Number(indexText);
    if (index < targetIndex) next[index] = value;
    if (index > targetIndex) next[index - 1] = value;
  }
  return next;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildRednoteTextMarkdown({
  title,
  content,
}: {
  title: string;
  content: string;
}): string {
  return [title.trim() ? `# ${title.trim()}` : "", content.trim()]
    .filter(Boolean)
    .join("\n\n");
}

function buildRednotePublishHtml({
  title,
  content,
  images,
}: {
  title: string;
  content: string;
  images: string[];
}): string {
  const imageHtml = images
    .map(
      (image, index) =>
        `<img src="${escapeHtml(image)}" alt="图${index + 1}" />`,
    )
    .join("");
  return [
    title.trim() ? `<h1>${escapeHtml(title.trim())}</h1>` : "",
    imageHtml,
    content
      .split("\n")
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join(""),
  ].join("");
}

function mergeImageTaskHistories(tasks: ImageTaskResponse[]): {
  historiesByUid: Record<string, PromptImageHistoryItem[]>;
  uidOrder: string[];
} {
  const historiesByUid: Record<string, PromptImageHistoryItem[]> = {};
  const uidOrder: string[] = [];
  const seenUids = new Set<string>();

  for (const task of [...tasks].reverse()) {
    for (const item of task.items) {
      if (!seenUids.has(item.uid)) {
        seenUids.add(item.uid);
        uidOrder.push(item.uid);
      }
    }
  }

  for (const task of tasks) {
    for (const item of task.items) {
      if (!historiesByUid[item.uid]) {
        historiesByUid[item.uid] = [];
      }
      historiesByUid[item.uid].push(imageTaskItemToHistoryItem(task, item));
    }
  }

  return { historiesByUid, uidOrder };
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function RednoteContentEditor({
  rednoteContent,
  className,
  threadId,
  imageSize,
  inputImages,
  userInput,
}: {
  rednoteContent: RednoteContent | null;
  className?: string;
  threadId: string;
  imageSize?: string | null;
  inputImages?: string[] | null;
  userInput?: string | null;
}) {
  const { beginDirectPublish, isPreparingPublishPreview } = usePublishFlow();
  const sourceKey = useMemo(
    () => JSON.stringify(rednoteContent ?? null),
    [rednoteContent],
  );
  const [draft, setDraft] = useState<EditableRednoteContent>(() =>
    createEditableContent(rednoteContent),
  );
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imageTaskId, setImageTaskId] = useState<string | null>(null);
  const [promptUidsByIndex, setPromptUidsByIndex] = useState<
    Record<number, string>
  >({});
  const [imageHistoriesByUid, setImageHistoriesByUid] = useState<
    Record<string, PromptImageHistoryItem[]>
  >({});
  const [selectedHistoryIndexes, setSelectedHistoryIndexes] = useState<
    Record<string, number>
  >({});
  const [editingPromptIndexes, setEditingPromptIndexes] = useState<
    Record<number, boolean>
  >({});
  const [hasImageTaskHistory, setHasImageTaskHistory] = useState(false);
  const [isImageTaskHistoryReady, setIsImageTaskHistoryReady] = useState(false);
  const [isSubmittingImageTask, setIsSubmittingImageTask] = useState(false);
  const [isDownloadingImageTask, setIsDownloadingImageTask] = useState(false);
  const [insufficientBalanceInfo, setInsufficientBalanceInfo] =
    useState<InsufficientBalanceInfo | null>(null);
  const [insufficientBalanceDialogOpen, setInsufficientBalanceDialogOpen] =
    useState(false);
  const [deletePromptIndex, setDeletePromptIndex] = useState<number | null>(
    null,
  );
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    if (!hasImageTaskHistory) {
      setDraft(createEditableContent(rednoteContent));
    }
  }, [hasImageTaskHistory, sourceKey, rednoteContent]);

  useEffect(() => {
    setInsufficientBalanceInfo(null);
    setInsufficientBalanceDialogOpen(false);
    setIsDownloadingImageTask(false);
  }, [threadId]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const applyImageTaskHistory = useCallback(
    (tasks: ImageTaskResponse[]): boolean => {
      const tasksWithItems = tasks.filter((task) => task.items.length > 0);
      if (tasksWithItems.length === 0) {
        setHasImageTaskHistory(false);
        setPromptUidsByIndex({});
        setImageHistoriesByUid({});
        setSelectedHistoryIndexes({});
        setEditingPromptIndexes({});
        setDraft(createEditableContent(rednoteContent));
        return false;
      }

      const { historiesByUid, uidOrder } =
        mergeImageTaskHistories(tasksWithItems);
      const baseContent = createEditableContent(rednoteContent);
      const nextPromptUids: Record<number, string> = {};
      const nextPrompts = uidOrder.map((uid, index) => {
        const latestHistory = historiesByUid[uid]?.[0];
        nextPromptUids[index] = uid;
        return {
          title: latestHistory?.title ?? "",
          text: latestHistory?.prompt ?? "",
        };
      });

      setHasImageTaskHistory(true);
      setPromptUidsByIndex(nextPromptUids);
      setImageHistoriesByUid(historiesByUid);
      setSelectedHistoryIndexes(
        Object.fromEntries(uidOrder.map((uid) => [uid, 0])),
      );
      setEditingPromptIndexes({});
      setDraft({
        title: baseContent.title,
        content: baseContent.content,
        prompts: nextPrompts,
      });
      return true;
    },
    [rednoteContent],
  );

  const refreshImageTaskHistory = useCallback(async () => {
    const response = await listThreadImageTasks(threadId);
    return applyImageTaskHistory(response.items);
  }, [applyImageTaskHistory, threadId]);

  const upsertImageTaskItems = useCallback((task: ImageTaskResponse) => {
    setImageHistoriesByUid((current) => {
      const next = { ...current };
      for (const item of task.items) {
        const entry = imageTaskItemToHistoryItem(task, item);
        const previous = next[item.uid] ?? [];
        const withoutSameTask = previous.filter(
          (historyItem) => historyItem.taskId !== task.id,
        );
        next[item.uid] = [entry, ...withoutSameTask];
      }
      return next;
    });
    setSelectedHistoryIndexes((current) => {
      const next = { ...current };
      for (const item of task.items) {
        next[item.uid] = 0;
      }
      return next;
    });
  }, []);

  const pollImageTask = useCallback(
    async (taskId: string, uidToIndex: Map<string, number>) => {
      try {
        const task = await getThreadImageTask(threadId, taskId);
        upsertImageTaskItems(task);
        const allSettled =
          task.items.length >= uidToIndex.size &&
          task.items.every((item) => isTerminalImageStatus(item.status));
        if (allSettled) {
          setImageTaskId(null);
          await refreshImageTaskHistory();
          return;
        }
        pollTimerRef.current = setTimeout(() => {
          void pollImageTask(taskId, uidToIndex);
        }, IMAGE_TASK_POLL_INTERVAL_MS);
      } catch {
        setImageTaskId(null);
        setImageHistoriesByUid((current) => {
          const next = { ...current };
          for (const uid of Object.keys(next)) {
            next[uid] = next[uid].map((item) =>
              item.taskId === taskId && !isTerminalImageStatus(item.status)
                ? { ...item, status: "failed" as const }
                : item,
            );
          }
          return next;
        });
      }
    },
    [refreshImageTaskHistory, threadId, upsertImageTaskItems],
  );

  const canGenerateImages = useMemo(
    () => draft.prompts.some((prompt) => prompt.text.trim().length > 0),
    [draft.prompts],
  );

  const isGeneratingImages = isSubmittingImageTask || imageTaskId !== null;
  const hasImageResults = useMemo(
    () =>
      Object.values(imageHistoriesByUid).some((history) => history.length > 0),
    [imageHistoriesByUid],
  );
  const canEditPromptPages =
    isImageTaskHistoryReady && !hasImageResults && !isGeneratingImages;
  const showGenerateImagesButton =
    isImageTaskHistoryReady &&
    draft.prompts.length > 0 &&
    !hasImageTaskHistory;
  const shouldRenderPromptPages =
    isImageTaskHistoryReady && (draft.prompts.length > 0 || canEditPromptPages);
  const firstCompletedImageTaskId = useMemo(() => {
    const historyItems = Object.values(imageHistoriesByUid)
      .flat()
      .filter((item) => item.taskId !== PENDING_IMAGE_TASK_ID)
      .sort((left, right) =>
        left.taskCreatedAt.localeCompare(right.taskCreatedAt),
      );
    const firstTaskId = historyItems[0]?.taskId ?? null;
    if (!firstTaskId) return null;

    const firstTaskItems = historyItems.filter((item) => item.taskId === firstTaskId);
    if (
      firstTaskItems.length === 0 ||
      firstTaskItems.some((item) => item.status !== "completed")
    ) {
      return null;
    }

    return firstTaskId;
  }, [imageHistoriesByUid]);
  const publishImages = useMemo(
    () =>
      draft.prompts
        .map((_, index) => {
          const uid = promptUidsByIndex[index];
          const history = uid ? (imageHistoriesByUid[uid] ?? []) : [];
          const selectedHistoryIndex = uid
            ? (selectedHistoryIndexes[uid] ?? 0)
            : 0;
          const currentHistory = history[selectedHistoryIndex];
          if (currentHistory?.status !== "completed") return "";
          return getGenImageUrl(currentHistory.url, threadId);
        })
        .filter((url): url is string => url.trim().length > 0),
    [
      draft.prompts,
      imageHistoriesByUid,
      promptUidsByIndex,
      selectedHistoryIndexes,
      threadId,
    ],
  );
  const canPublishRednote =
    hasImageResults &&
    !isGeneratingImages &&
    draft.prompts.length > 0 &&
    publishImages.length === draft.prompts.length;
  const showPublishRednoteButton =
    !showGenerateImagesButton && hasImageResults;

  const submitImageTask = useCallback(
    async (
      submissionPrompts: ImageTaskSubmissionPrompt[],
      { resetEditing = false }: { resetEditing?: boolean } = {},
    ) => {
      if (submissionPrompts.length === 0 || isGeneratingImages) return;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }

      const uidToIndex = new Map(
        submissionPrompts.map((prompt) => [prompt.uid, prompt.index]),
      );
      const prompts: ImageTaskPrompt[] = submissionPrompts.map((prompt) => ({
        uid: prompt.uid,
        title: prompt.title,
        prompt: prompt.prompt,
      }));
      const timestamp = new Date().toISOString();

      setPromptUidsByIndex((current) => {
        const next = { ...current };
        for (const prompt of submissionPrompts) {
          next[prompt.index] = prompt.uid;
        }
        return next;
      });
      setImageHistoriesByUid((current) => {
        const next = { ...current };
        for (const prompt of prompts) {
          next[prompt.uid] = [
            createPendingHistoryItem(prompt, timestamp),
            ...(next[prompt.uid] ?? []),
          ];
        }
        return next;
      });
      setSelectedHistoryIndexes((current) => ({
        ...current,
        ...Object.fromEntries(prompts.map((prompt) => [prompt.uid, 0])),
      }));
      setEditingPromptIndexes((current) => {
        if (resetEditing) return {};
        return {
          ...current,
          ...Object.fromEntries(
            submissionPrompts.map((prompt) => [prompt.index, false]),
          ),
        };
      });
      setIsSubmittingImageTask(true);

      try {
        const task = await createThreadImageTask(threadId, {
          prompts,
          size: imageSize ?? null,
          input_images: inputImages ?? [],
          metadata: {
            thread_id: threadId,
            platform: "xhs",
            user_input: userInput?.trim() ?? "",
            title: draft.title.trim(),
            content: draft.content.trim(),
          },
        });
        setImageTaskId(task.id);
        setImageHistoriesByUid((current) => {
          const next = { ...current };
          for (const prompt of prompts) {
            next[prompt.uid] = (next[prompt.uid] ?? []).filter(
              (item) => item.taskId !== PENDING_IMAGE_TASK_ID,
            );
          }
          return next;
        });
        upsertImageTaskItems(task);
        const allSettled =
          task.items.length >= uidToIndex.size &&
          task.items.every((item) => isTerminalImageStatus(item.status));
        if (!allSettled) {
          pollTimerRef.current = setTimeout(() => {
            void pollImageTask(task.id, uidToIndex);
          }, IMAGE_TASK_POLL_INTERVAL_MS);
        } else {
          setImageTaskId(null);
          await refreshImageTaskHistory();
        }
      } catch (error) {
        const balanceInfo = extractInsufficientBalanceInfo(
          getApiErrorData(error) ?? error,
        );
        if (balanceInfo) {
          setInsufficientBalanceInfo(balanceInfo);
          setInsufficientBalanceDialogOpen(true);
        } else {
          setInsufficientBalanceInfo(null);
          toast.error(getApiErrorMessage(error, "图片生成失败，请稍后重试。"));
        }
        setImageHistoriesByUid((current) => {
          const next = { ...current };
          for (const prompt of prompts) {
            next[prompt.uid] = (next[prompt.uid] ?? []).filter(
              (item) => item.taskId !== PENDING_IMAGE_TASK_ID,
            );
            if (next[prompt.uid].length === 0) {
              delete next[prompt.uid];
            }
          }
          return next;
        });
      } finally {
        setIsSubmittingImageTask(false);
      }
    },
    [
      imageSize,
      inputImages,
      isGeneratingImages,
      pollImageTask,
      refreshImageTaskHistory,
      userInput,
      draft.content,
      draft.title,
      threadId,
      upsertImageTaskItems,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    setIsImageTaskHistoryReady(false);
    void (async () => {
      try {
        const response = await listThreadImageTasks(threadId);
        if (cancelled) return;
        applyImageTaskHistory(response.items);
        setIsImageTaskHistoryReady(true);
        const activeTask = response.items.find((task) =>
          task.items.some((item) => !isTerminalImageStatus(item.status)),
        );
        if (activeTask) {
          setImageTaskId(activeTask.id);
          const uidToIndex = new Map(
            activeTask.items.map((item, index) => [item.uid, index]),
          );
          void pollImageTask(activeTask.id, uidToIndex);
        }
      } catch {
        if (!cancelled) {
          setHasImageTaskHistory(false);
          setIsImageTaskHistoryReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyImageTaskHistory, pollImageTask, threadId]);

  useEffect(() => {
    if (!canEditPromptPages) {
      setDeletePromptIndex(null);
    }
  }, [canEditPromptPages]);

  const handleAddPrompt = useCallback(() => {
    if (!canEditPromptPages) return;
    setDraft((current) => ({
      ...current,
      prompts: [
        ...current.prompts,
        {
          title: current.prompts.length === 0 ? "封面" : "内容",
          text: "",
        },
      ],
    }));
  }, [canEditPromptPages]);

  const handleConfirmDeletePrompt = useCallback(() => {
    if (!canEditPromptPages || deletePromptIndex === null) return;
    const targetIndex = deletePromptIndex;
    setDraft((current) => ({
      ...current,
      prompts: current.prompts.filter((_, index) => index !== targetIndex),
    }));
    setPromptUidsByIndex((current) =>
      removeIndexedRecordItem(current, targetIndex),
    );
    setEditingPromptIndexes((current) =>
      removeIndexedRecordItem(current, targetIndex),
    );
    setDeletePromptIndex(null);
  }, [canEditPromptPages, deletePromptIndex]);

  const handleGenerateImages = useCallback(async () => {
    if (!canGenerateImages || isGeneratingImages) return;

    const prompts = draft.prompts
      .map((prompt, index): ImageTaskSubmissionPrompt | null => {
        const text = prompt.text.trim();
        if (!text) return null;
        const uid = promptUidsByIndex[index] ?? createPromptUid(index);
        return {
          uid,
          index,
          title: getPromptTaskTitle(prompt, index),
          prompt: text,
        };
      })
      .filter((item): item is ImageTaskSubmissionPrompt => item !== null);

    await submitImageTask(prompts, { resetEditing: true });
  }, [
    canGenerateImages,
    draft.prompts,
    isGeneratingImages,
    promptUidsByIndex,
    submitImageTask,
  ]);

  const handleRegeneratePrompt = useCallback(
    async (index: number) => {
      if (isGeneratingImages) return;
      const prompt = draft.prompts[index];
      const text = prompt?.text.trim() ?? "";
      if (!text) return;

      const uid = promptUidsByIndex[index] ?? createPromptUid(index);
      const prompts: ImageTaskSubmissionPrompt[] = [
        {
          uid,
          index,
          title: getPromptTaskTitle(prompt, index),
          prompt: text,
        },
      ];

      await submitImageTask(prompts);
    },
    [
      draft.prompts,
      isGeneratingImages,
      promptUidsByIndex,
      submitImageTask,
    ],
  );

  const handlePublishRednote = useCallback(() => {
    if (!canPublishRednote) return;
    const title = draft.title.trim();
    const content = draft.content.trim();
    const markdown = buildRednoteTextMarkdown({ title, content });
    const contentHtml = buildRednotePublishHtml({
      title,
      content,
      images: publishImages,
    });
    const artifactPath = `rednote-image-cards:${threadId}`;

    void beginDirectPublish({
      threadId,
      artifactPath,
      title,
      contentHtml,
      markdownSnapshot: markdown,
      allowedPlatformIds: ["rednote"],
      allowedPublishPlatformIds: ["rednote"],
      previewVariant: "rednote-image-cards",
      rednotePreview: {
        images: publishImages,
        title,
        content,
      },
      createPublishEdit: async (selectedAccountIds) => {
        const publishEdit: PublishEditResponse = {
          thread_id: threadId,
          artifacts: artifactPath,
          platform: {
            rednote: {
              accounts: selectedAccountIds.map((accountId) => ({
                id: accountId,
                avatar: null,
                nickname: "",
                account: "",
                platform: "rednote",
              })),
              content: markdown,
              draft: false,
              skip_image_upload: false,
              timeout: 60,
              platform_options: {
                title,
                image_cards: true,
                images: publishImages,
                privacy: "PUBLIC",
                original: false,
                note_copyable: false,
              },
            },
          },
        };
        return publishEdit;
      },
    });
  }, [
    beginDirectPublish,
    canPublishRednote,
    draft.content,
    draft.title,
    publishImages,
    threadId,
  ]);

  const handleDownloadFirstImageTask = useCallback(async () => {
    if (!firstCompletedImageTaskId || isDownloadingImageTask) return;

    setIsDownloadingImageTask(true);
    try {
      const blob = await downloadThreadImageTask(
        threadId,
        firstCompletedImageTaskId,
      );
      saveBlob(blob, `rednote-images-${firstCompletedImageTaskId}.zip`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "下载失败，请稍后重试。"));
    } finally {
      setIsDownloadingImageTask(false);
    }
  }, [firstCompletedImageTaskId, isDownloadingImageTask, threadId]);

  if (!rednoteContent) {
    return null;
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-7 px-6 py-8",
        className,
      )}
    >
      <section className="rounded-lg border border-border/70 bg-card p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-border/70">
            <Image
              src="/platform-logos/xiao-hong-shu.png"
              alt=""
              width={28}
              height={28}
              className="size-full object-cover"
            />
          </span>
          <h2 className="text-lg font-semibold text-foreground">标题正文</h2>
        </header>

        <div className="space-y-7">
          <label className="block">
            <span className="mb-2.5 block text-base font-medium leading-none text-foreground">
              标题
            </span>
            <Input
              className="h-11 rounded-md bg-background px-4 !text-[16px]"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label className="block">
            <span className="mb-2.5 block text-base font-medium leading-none text-foreground">
              正文内容
            </span>
            <Textarea
              className="min-h-[240px] rounded-md bg-background px-4 py-3 !text-[16px] leading-7"
              value={draft.content}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>

      {shouldRenderPromptPages ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {draft.prompts.map((prompt, index) => {
            const uid = promptUidsByIndex[index];
            const history = uid ? (imageHistoriesByUid[uid] ?? []) : [];
            const selectedHistoryIndex = uid
              ? (selectedHistoryIndexes[uid] ?? 0)
              : 0;
            const currentHistory = history[selectedHistoryIndex];
            const currentSrc =
              currentHistory?.status === "completed"
                ? getGenImageUrl(currentHistory.url, threadId)
                : "";
            const canToggleResult =
              !!currentHistory && isTerminalImageStatus(currentHistory.status);
            const isEditingPrompt = editingPromptIndexes[index] === true;
            const selectHistory = (nextIndex: number) => {
              if (!uid) return;
              const target = history[nextIndex];
              if (!target) return;
              setSelectedHistoryIndexes((current) => ({
                ...current,
                [uid]: nextIndex,
              }));
              setEditingPromptIndexes((current) => ({
                ...current,
                [index]: false,
              }));
              setDraft((current) => ({
                ...current,
                prompts: current.prompts.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, title: target.title ?? item.title, text: target.prompt }
                    : item,
                ),
              }));
            };
            const promptTitle = prompt.title.trim() || (index === 0 ? "封面" : "内容");

            return (
              <article
                key={index}
                className="flex min-h-[400px] flex-col rounded-lg border border-border/70 bg-card p-4 shadow-sm"
              >
                <header className="mb-3 flex min-w-0 items-center gap-2 border-b border-border/70 pb-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="shrink-0 text-base font-semibold text-muted-foreground">
                      P{index + 1}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 max-w-full truncate",
                        index === 0
                          ? "rounded-md bg-rose-50 px-2 py-0.5 text-base font-semibold text-rose-600 ring-1 ring-rose-200"
                          : "text-base font-semibold text-foreground",
                      )}
                      title={promptTitle}
                    >
                      {promptTitle}
                    </span>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    {history.length > 1 ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-md text-muted-foreground hover:bg-[#ff2442]/10 hover:text-[#ff2442]"
                          disabled={selectedHistoryIndex >= history.length - 1}
                          onClick={() => selectHistory(selectedHistoryIndex + 1)}
                          title="上一张历史图片"
                          aria-label="上一张历史图片"
                        >
                          <ChevronLeftIcon className="size-4" />
                        </Button>
                        <span className="min-w-8 text-center text-xs text-muted-foreground">
                          {selectedHistoryIndex + 1}/{history.length}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-md text-muted-foreground hover:bg-[#ff2442]/10 hover:text-[#ff2442]"
                          disabled={selectedHistoryIndex <= 0}
                          onClick={() => selectHistory(selectedHistoryIndex - 1)}
                          title="下一张历史图片"
                          aria-label="下一张历史图片"
                        >
                          <ChevronRightIcon className="size-4" />
                        </Button>
                      </>
                    ) : null}
                    {hasImageResults ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-md text-muted-foreground hover:bg-[#ff2442]/10 hover:text-[#ff2442]"
                        disabled={isGeneratingImages}
                        onClick={() => void handleRegeneratePrompt(index)}
                        title="重新生成图片"
                        aria-label="重新生成图片"
                      >
                        <RefreshCwIcon className="size-4" />
                      </Button>
                    ) : null}
                    {canToggleResult ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-md text-muted-foreground hover:bg-[#ff2442]/10 hover:text-[#ff2442]"
                        onClick={() =>
                          setEditingPromptIndexes((current) => ({
                            ...current,
                            [index]: !current[index],
                          }))
                        }
                        title={isEditingPrompt ? "查看生成图片" : "编辑提示词"}
                        aria-label={isEditingPrompt ? "查看生成图片" : "编辑提示词"}
                      >
                        {isEditingPrompt ? (
                          <ImageIcon className="size-4" />
                        ) : (
                          <PencilIcon className="size-4" />
                        )}
                      </Button>
                    ) : null}
                    {canEditPromptPages ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletePromptIndex(index)}
                        title="删除图文"
                        aria-label="删除图文"
                      >
                        <XIcon className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </header>

                <label className="flex min-h-0 flex-1 flex-col gap-2">
                  {(() => {
                    if (currentHistory && isEditingPrompt) {
                      return (
                        <Textarea
                          className="min-h-[330px] flex-1 rounded-md bg-background font-mono !text-[15px] leading-7"
                          placeholder="请输入图文提示词..."
                          value={prompt.text}
                          onChange={(event) => {
                            const nextText = event.target.value;
                            setDraft((current) => ({
                              ...current,
                              prompts: current.prompts.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, text: nextText }
                                  : item,
                              ),
                            }));
                          }}
                        />
                      );
                    }

                    if (currentHistory?.status === "failed") {
                      return <ImageGenerationFailed />;
                    }

                    if (currentHistory?.status === "completed" && !currentSrc) {
                      return <ImageGenerationFailed />;
                    }

                    if (
                      currentHistory?.status === "completed" &&
                      currentSrc
                    ) {
                      return (
                        <button
                          type="button"
                          className="min-h-[330px] flex-1 cursor-zoom-in overflow-hidden rounded-md bg-muted/20"
                          onClick={() =>
                            setPreviewImage({
                              src: currentSrc,
                              alt: promptTitle,
                            })
                          }
                          title="预览图片"
                          aria-label="预览图片"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentSrc}
                            alt={promptTitle}
                            className="h-full min-h-[330px] w-full object-cover"
                          />
                        </button>
                      );
                    }

                    if (currentHistory) {
                      return <ImageGenerationLoading />;
                    }

                    return (
                      <Textarea
                        className="min-h-[330px] flex-1 rounded-md bg-background font-mono !text-[15px] leading-7"
                        placeholder="请输入图文提示词..."
                        value={prompt.text}
                        onChange={(event) => {
                          const nextText = event.target.value;
                          setDraft((current) => ({
                            ...current,
                            prompts: current.prompts.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, text: nextText }
                                : item,
                            ),
                          }));
                        }}
                      />
                    );
                  })()}
                </label>
              </article>
            );
          })}
          {canEditPromptPages ? (
            <button
              type="button"
              className="flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-card p-4 text-muted-foreground shadow-sm transition-colors hover:border-[#ff2442]/40 hover:text-[#ff2442]"
              onClick={handleAddPrompt}
              title="添加图文"
            >
              <PlusIcon className="size-6" />
              <span className="mt-3 text-sm font-medium">添加图文</span>
            </button>
          ) : null}
        </section>
      ) : null}

      {showGenerateImagesButton ? (
        <div className="flex justify-center">
          <Button
            type="button"
            className="h-10 gap-2 rounded-full bg-[#ff2442] px-5 font-semibold text-white shadow-sm hover:bg-[#e51f3b]"
            disabled={!canGenerateImages || isGeneratingImages}
            onClick={handleGenerateImages}
            title="生成图片"
          >
            <ImageIcon className="size-4" />
            <span>{isGeneratingImages ? "生成中..." : "生成图片"}</span>
          </Button>
        </div>
      ) : null}
      {showPublishRednoteButton ? (
        <div className="flex justify-center gap-3">
          {firstCompletedImageTaskId ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-full px-5 font-semibold shadow-sm"
              disabled={isDownloadingImageTask}
              onClick={handleDownloadFirstImageTask}
              title="下载"
            >
              <DownloadIcon className="size-4" />
              <span>{isDownloadingImageTask ? "下载中..." : "下载"}</span>
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-10 gap-2 rounded-full bg-[#ff2442] px-6 font-semibold text-white shadow-sm hover:bg-[#e51f3b]"
            disabled={!canPublishRednote || isPreparingPublishPreview}
            onClick={handlePublishRednote}
            title="发布"
          >
            <SendIcon className="size-4" />
            <span>{isPreparingPublishPreview ? "加载中..." : "发布"}</span>
          </Button>
        </div>
      ) : null}
      <ImagePreviewDialog
        open={Boolean(previewImage?.src?.trim())}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
        src={previewImage?.src?.trim() ?? ""}
        alt={previewImage?.alt ?? "preview-image"}
      />
      <DeleteConfirmDialog
        open={deletePromptIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePromptIndex(null);
        }}
        onConfirm={handleConfirmDeletePrompt}
        closeLabel="关闭"
        title="删除图文"
        description="删除后当前图文面板的提示词会被移除，确认继续吗？"
        cancelLabel="取消"
        confirmLabel="删除"
      />
      <Dialog
        open={insufficientBalanceDialogOpen}
        onOpenChange={setInsufficientBalanceDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>余额不足提醒</DialogTitle>
            <DialogDescription className="pt-1 text-sm text-foreground/80">
              {insufficientBalanceInfo?.message ?? "账户余额不足，请先充值后再试。"}
              {typeof insufficientBalanceInfo?.availablePoints === "number" &&
              typeof insufficientBalanceInfo?.requiredPoints === "number"
                ? `（当前余额：${insufficientBalanceInfo.availablePoints}，所需：${insufficientBalanceInfo.requiredPoints}）`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setInsufficientBalanceDialogOpen(false)}
            >
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
