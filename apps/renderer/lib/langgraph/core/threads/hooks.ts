import type { AIMessage, Message } from "@langchain/langgraph-sdk";
import type { ThreadsClient } from "@langchain/langgraph-sdk/client";
import { useStream } from "@langchain/langgraph-sdk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { PromptInputMessage } from "@/components/langgraph/ai-elements/prompt-input";

import { getAPIClient } from "../api";
import { useI18n } from "../i18n/hooks";
import type { FileInMessage } from "../messages/utils";
import type { LocalSettings } from "../settings";
import { useUpdateSubtask } from "../tasks/context";
import type { UploadedFileInfo } from "../uploads";
import { getUploadPreviewUrl, uploadFiles } from "../uploads";

import type { AgentThread, AgentThreadState } from "./types";

export type ToolEndEvent = {
  name: string;
  data: unknown;
};

export type ThreadStreamOptions = {
  threadId?: string | null | undefined;
  assistantId?: string;
  context: LocalSettings["context"];
  onStart?: (threadId: string) => void;
  onFinish?: (state: AgentThreadState) => void;
  onToolEnd?: (event: ToolEndEvent) => void;
};

type RunStreamMode =
  | "values"
  | "messages"
  | "messages-tuple"
  | "updates"
  | "events"
  | "debug"
  | "tasks"
  | "checkpoints"
  | "custom";

export type ThreadRunOptions = {
  streamMode?: RunStreamMode[];
};

const IMAGE_FILE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "svg",
  "tiff",
  "ico",
  "heic",
]);

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

function buildHumanMessageContent(
  text: string,
  imageUrls: string[],
): Message["content"] {
  return [
    {
      type: "text",
      text,
    },
    ...imageUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    })),
  ];
}

function isImageExtension(extension: string | undefined): boolean {
  return IMAGE_FILE_EXTENSIONS.has(
    (extension || "")
      .replace(/^\./, "")
      .toLowerCase(),
  );
}

function isUploadedImageFile(file: UploadedFileInfo): boolean {
  return isImageExtension(file.extension || file.filename.split(".").pop());
}

function isPromptInputImageFile(
  file: NonNullable<PromptInputMessage["files"]>[number] | undefined,
): boolean {
  if (!file) return false;
  if (file.mediaType?.startsWith("image/")) return true;
  return isImageExtension(file.filename?.split(".").pop());
}

function isPromptInputLocalFile(
  file: NonNullable<PromptInputMessage["files"]>[number] | undefined,
): boolean {
  return Boolean(
    file?.filename &&
      (file.url?.startsWith("blob:") || file.url?.startsWith("data:")),
  );
}

function isPromptInputExistingFile(
  file: NonNullable<PromptInputMessage["files"]>[number] | undefined,
): boolean {
  return Boolean(
    file?.url &&
      (file.url.startsWith("http://") || file.url.startsWith("https://")),
  );
}

function getStreamErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const message = Reflect.get(error, "message");
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    const nestedError = Reflect.get(error, "error");
    if (nestedError instanceof Error && nestedError.message.trim()) {
      return nestedError.message;
    }
    if (typeof nestedError === "string" && nestedError.trim()) {
      return nestedError;
    }
  }
  return "Request failed.";
}

function shouldSilentlyIgnoreStreamError(error: unknown): boolean {
  const message = getStreamErrorMessage(error).toLowerCase();
  if (!message) return false;

  // Deleting an active thread can leave an in-flight stream/run.
  // The backend may then return "404 Run not found"/"thread not found".
  if (message.includes("run not found")) return true;
  if (message.includes("thread not found")) return true;
  if (message.includes("404") && message.includes("not found")) return true;

  // Navigating between pages may trigger a create-thread attempt for a threadId
  // that already exists. In that case, 409 can be safely ignored because the
  // thread is still usable.
  if (message.includes("already exists") && (message.includes("thread") || message.includes("thread with id"))) {
    return true;
  }

  const status = Reflect.get(error as object, "status");
  if (status === 404) return true;
  if (status === 409) return true;

  return false;
}

export function useThreadStream({
  threadId,
  assistantId = "lead_agent",
  context,
  onStart,
  onFinish,
  onToolEnd,
}: ThreadStreamOptions) {
  const { t } = useI18n();
  // Optimistic messages shown before / alongside the server stream
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Track the thread ID that is currently streaming to handle thread changes during streaming
  const [onStreamThreadId, setOnStreamThreadId] = useState(() => threadId);
  // Ref to track current thread ID across async callbacks without causing re-renders,
  // and to allow access to the current thread id in onUpdateEvent
  const threadIdRef = useRef<string | null>(threadId ?? null);
  const startedRef = useRef(false);

  const listeners = useRef({
    onStart,
    onFinish,
    onToolEnd,
  });

  // Keep listeners ref updated with latest callbacks
  useEffect(() => {
    listeners.current = { onStart, onFinish, onToolEnd };
  }, [onStart, onFinish, onToolEnd]);

  useEffect(() => {
    const normalizedThreadId = threadId ?? null;
    if (!normalizedThreadId) {
      // Just reset for new thread creation when threadId becomes null/undefined
      startedRef.current = false;
      setOnStreamThreadId(normalizedThreadId);
    }
    threadIdRef.current = normalizedThreadId;
  }, [threadId]);

  const _handleOnStart = useCallback((id: string) => {
    if (!startedRef.current) {
      listeners.current.onStart?.(id);
      startedRef.current = true;
    }
  }, []);

  const handleStreamStart = useCallback(
    (_threadId: string) => {
      threadIdRef.current = _threadId;
      _handleOnStart(_threadId);
    },
    [_handleOnStart],
  );

  const queryClient = useQueryClient();
  const updateSubtask = useUpdateSubtask();

  const thread = useStream<AgentThreadState>({
    client: getAPIClient(),
    assistantId,
    threadId: onStreamThreadId,
    reconnectOnMount: true,
    fetchStateHistory: { limit: 1 },
    onCreated(meta) {
      handleStreamStart(meta.thread_id);
      setOnStreamThreadId(meta.thread_id);
    },
    onLangChainEvent(event) {
      if (event.event === "on_tool_end") {
        listeners.current.onToolEnd?.({
          name: event.name,
          data: event.data,
        });
      }
    },
    onUpdateEvent(data) {
      const updates: Array<Partial<AgentThreadState> | null> = Object.values(
        data || {},
      );
      for (const update of updates) {
        if (update && "title" in update && update.title) {
          void queryClient.setQueriesData(
            {
              queryKey: ["threads", "search"],
              exact: false,
            },
            (oldData: Array<AgentThread> | undefined) => {
              return oldData?.map((t) => {
                if (t.thread_id === threadIdRef.current) {
                  return {
                    ...t,
                    values: {
                      ...t.values,
                      title: update.title,
                    },
                  };
                }
                return t;
              });
            },
          );
        }
      }
    },
    onCustomEvent(event: unknown) {
      if (
        typeof event === "object" &&
        event !== null &&
        "type" in event &&
        event.type === "task_running"
      ) {
        const e = event as {
          type: "task_running";
          task_id: string;
          message: AIMessage;
        };
        updateSubtask({ id: e.task_id, latestMessage: e.message });
        return;
      }
    },
    onError(error) {
      setOptimisticMessages([]);
      if (shouldSilentlyIgnoreStreamError(error)) {
        return;
      }
      toast.error(getStreamErrorMessage(error));
    },
    onFinish(state) {
      listeners.current.onFinish?.(state.values);
      void queryClient.invalidateQueries({ queryKey: ["threads", "search"] });
    },
  });

  const sendInFlightRef = useRef(false);
  // Track message count before sending so we know when server has responded
  const prevMsgCountRef = useRef(thread.messages.length);

  // Clear optimistic when server messages arrive (count increases)
  useEffect(() => {
    if (
      optimisticMessages.length > 0 &&
      thread.messages.length > prevMsgCountRef.current
    ) {
      setOptimisticMessages([]);
    }
  }, [thread.messages.length, optimisticMessages.length]);

  const sendMessage = useCallback(
    async (
      threadId: string,
      message: PromptInputMessage,
      extraContext?: Record<string, unknown>,
      extraAdditionalKwargs?: Record<string, unknown>,
      runOptions?: ThreadRunOptions,
    ) => {
      if (sendInFlightRef.current) {
        return;
      }
      sendInFlightRef.current = true;

      const text = message.text.trim();

      // Capture current count before showing optimistic messages
      prevMsgCountRef.current = thread.messages.length;

      // Build optimistic files list with uploading status
      const optimisticFiles: FileInMessage[] = (message.files ?? [])
        .filter(
          (file) => isPromptInputLocalFile(file) || isPromptInputExistingFile(file),
        )
        .map((f) => ({
          filename: f.filename ?? "",
          size: 0,
          ...(isPromptInputExistingFile(f) ? { url: f.url } : {}),
          status: isPromptInputExistingFile(f)
            ? ("uploaded" as const)
            : ("uploading" as const),
        }));
      const hasUploadingFiles = optimisticFiles.some(
        (file) => file.status === "uploading",
      );

      // Create optimistic human message (shown immediately)
      const optimisticHumanMsg: Message = {
        type: "human",
        id: `opt-human-${Date.now()}`,
        content: text ? [{ type: "text", text }] : "",
        additional_kwargs: {
          ...(optimisticFiles.length > 0 ? { files: optimisticFiles } : {}),
          ...(extraAdditionalKwargs ?? {}),
        },
      };

      const newOptimistic: Message[] = [optimisticHumanMsg];
      if (hasUploadingFiles) {
        // Mock AI message while files are being uploaded
        newOptimistic.push({
          type: "ai",
          id: `opt-ai-${Date.now()}`,
          content: t.uploads.uploadingFiles,
          additional_kwargs: { element: "task" },
        });
      }
      setOptimisticMessages(newOptimistic);

      _handleOnStart(threadId);

      let uploadedFileInfo: UploadedFileInfo[] = [];

      try {
        // Upload files first if any
        const uploadableFileParts = message.files?.filter(isPromptInputLocalFile) ?? [];
        if (uploadableFileParts.length > 0) {
          setIsUploading(true);
          try {
            // Convert FileUIPart to File objects by fetching blob URLs
            const filePromises = uploadableFileParts.map(async (fileUIPart) => {
              if (fileUIPart.url && fileUIPart.filename) {
                try {
                  // Fetch the blob URL to get the file data
                  const response = await fetch(fileUIPart.url);
                  const blob = await response.blob();

                  // Create a File object from the blob
                  return new File([blob], fileUIPart.filename, {
                    type: fileUIPart.mediaType || blob.type,
                  });
                } catch (error) {
                  console.error(
                    `Failed to fetch file ${fileUIPart.filename}:`,
                    error,
                  );
                  return null;
                }
              }
              return null;
            });

            const conversionResults = await Promise.all(filePromises);
            const files = conversionResults.filter(
              (file): file is File => file !== null,
            );
            const failedConversions = conversionResults.length - files.length;

            if (failedConversions > 0) {
              throw new Error(
                `Failed to prepare ${failedConversions} attachment(s) for upload. Please retry.`,
              );
            }

            if (!threadId) {
              throw new Error("Thread is not ready for file upload.");
            }

            if (files.length > 0) {
              const uploadResponse = await uploadFiles(threadId, files);
              uploadedFileInfo = uploadResponse.files;

              // Update optimistic human message with uploaded status + paths
              const uploadedFiles: FileInMessage[] = uploadedFileInfo.map(
                (info) => ({
                  filename: info.filename,
                  size: info.size,
                  path: info.virtual_path,
                  status: "uploaded" as const,
                }),
              );
              setOptimisticMessages((messages) => {
                if (messages.length > 1 && messages[0]) {
                  const humanMessage: Message = messages[0];
                  return [
                    {
                      ...humanMessage,
                      additional_kwargs: { files: uploadedFiles },
                    },
                    ...messages.slice(1),
                  ];
                }
                return messages;
              });
            }
          } catch (error) {
            console.error("Failed to upload files:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to upload files.";
            toast.error(errorMessage);
            setOptimisticMessages([]);
            throw error;
          } finally {
            setIsUploading(false);
          }
        }

        // Build files metadata for submission (included in additional_kwargs)
        const filesForSubmit: FileInMessage[] = uploadedFileInfo.map(
          (info) => ({
            filename: info.filename,
            size: info.size,
            path: info.virtual_path,
            status: "uploaded" as const,
          }),
        );
        const existingFilesForSubmit: FileInMessage[] = (message.files ?? [])
          .filter(isPromptInputExistingFile)
          .map((file) => ({
            filename: file.filename ?? "reference-image",
            size: 0,
            url: file.url,
            status: "uploaded" as const,
          }));
        const uploadedInputImages = uploadedFileInfo
          .filter(
            (info, index) =>
              isUploadedImageFile(info) ||
              isPromptInputImageFile(uploadableFileParts[index]),
          )
          .map(getUploadPreviewUrl)
          .filter((url): url is string => Boolean(url));
        const existingInputImages = (message.files ?? [])
          .map((file) => file.url)
          .filter(
            (url): url is string =>
              typeof url === "string" &&
              url.length > 0 &&
              (url.startsWith("http://") || url.startsWith("https://")),
          );
        const inputImages = Array.from(
          new Set([
            ...readStringArray(context.input_images),
            ...readStringArray(extraContext?.input_images),
            ...existingInputImages,
            ...uploadedInputImages,
          ]),
        );

        const contentImageUrls =
          assistantId === "image_cards" ? inputImages : [];

        await thread.submit(
          {
            messages: [
              {
                type: "human",
                content: buildHumanMessageContent(text, contentImageUrls),
                additional_kwargs:
                  {
                    ...(filesForSubmit.length > 0 ||
                    existingFilesForSubmit.length > 0
                      ? { files: [...existingFilesForSubmit, ...filesForSubmit] }
                      : {}),
                    ...(extraAdditionalKwargs ?? {}),
                  },
              },
            ],
          },
          {
            threadId: threadId,
            streamMode: runOptions?.streamMode,
            streamSubgraphs: true,
            streamResumable: true,
            config: {
              recursion_limit: 1000,
            },
            context: {
              ...context,
              ...extraContext,
              ...(inputImages.length > 0 ? { input_images: inputImages } : {}),
              thinking_enabled: context.mode !== "flash",
              is_plan_mode: context.mode === "pro" || context.mode === "ultra",
              subagent_enabled: context.mode === "ultra",
              search_enabled: context.search_enabled ?? true,
              reasoning_effort:
                context.reasoning_effort ??
                (context.mode === "ultra"
                  ? "high"
                  : context.mode === "pro"
                    ? "medium"
                    : context.mode === "thinking"
                      ? "low"
                      : undefined),
              thread_id: threadId,
            },
          },
        );
        void queryClient.invalidateQueries({ queryKey: ["threads", "search"] });
      } catch (error) {
        setOptimisticMessages([]);
        setIsUploading(false);
        if (shouldSilentlyIgnoreStreamError(error)) {
          return;
        }
        throw error;
      } finally {
        sendInFlightRef.current = false;
      }
    },
    [
      assistantId,
      thread,
      _handleOnStart,
      t.uploads.uploadingFiles,
      context,
      queryClient,
    ],
  );

  // Merge thread with optimistic messages for display
  const mergedThread =
    optimisticMessages.length > 0
      ? ({
          ...thread,
          messages: [...thread.messages, ...optimisticMessages],
        } as typeof thread)
      : thread;

  return [mergedThread, sendMessage, isUploading] as const;
}

export function useThreads(
  params: Parameters<ThreadsClient["search"]>[0] = {
    limit: 50,
    sortBy: "updated_at",
    sortOrder: "desc",
    select: ["thread_id", "updated_at", "values"],
  },
  options?: { enabled?: boolean },
) {
  const apiClient = getAPIClient();
  const enabled = options?.enabled ?? true;
  return useQuery<AgentThread[]>({
    queryKey: ["threads", "search", params],
    enabled,
    queryFn: async () => {
      const maxResults = params.limit;
      const initialOffset = params.offset ?? 0;
      const DEFAULT_PAGE_SIZE = 50;

      // Preserve prior semantics: if a non-positive limit is explicitly provided,
      // delegate to a single search call with the original parameters.
      if (maxResults !== undefined && maxResults <= 0) {
        const response = await apiClient.threads.search<AgentThreadState>(params);
        return response as AgentThread[];
      }

      const pageSize =
        typeof maxResults === "number" && maxResults > 0
          ? Math.min(DEFAULT_PAGE_SIZE, maxResults)
          : DEFAULT_PAGE_SIZE;

      const threads: AgentThread[] = [];
      let offset = initialOffset;

      while (true) {
        if (typeof maxResults === "number" && threads.length >= maxResults) {
          break;
        }

        const currentLimit =
          typeof maxResults === "number"
            ? Math.min(pageSize, maxResults - threads.length)
            : pageSize;

        if (typeof maxResults === "number" && currentLimit <= 0) {
          break;
        }

        const response = (await apiClient.threads.search<AgentThreadState>({
          ...params,
          limit: currentLimit,
          offset,
        })) as AgentThread[];

        threads.push(...response);

        if (response.length < currentLimit) {
          break;
        }

        offset += response.length;
      }

      return threads;
    },
    refetchOnWindowFocus: false,
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();
  const apiClient = getAPIClient();
  return useMutation({
    mutationFn: async ({ threadId }: { threadId: string }) => {
      await apiClient.threads.delete(threadId);
    },
    onSuccess(_, { threadId }) {
      queryClient.setQueriesData(
        {
          queryKey: ["threads", "search"],
          exact: false,
        },
        (oldData: Array<AgentThread>) => {
          return oldData.filter((t) => t.thread_id !== threadId);
        },
      );
    },
  });
}

export function useRenameThread() {
  const queryClient = useQueryClient();
  const apiClient = getAPIClient();
  return useMutation({
    mutationFn: async ({
      threadId,
      title,
    }: {
      threadId: string;
      title: string;
    }) => {
      await apiClient.threads.updateState(threadId, {
        values: { title },
      });
    },
    onSuccess(_, { threadId, title }) {
      queryClient.setQueriesData(
        {
          queryKey: ["threads", "search"],
          exact: false,
        },
        (oldData: Array<AgentThread>) => {
          return oldData.map((t) => {
            if (t.thread_id === threadId) {
              return {
                ...t,
                values: {
                  ...t.values,
                  title,
                },
              };
            }
            return t;
          });
        },
      );
    },
  });
}
