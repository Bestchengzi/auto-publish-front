import type { FileUIPart } from "ai";

const STORAGE_KEY = "creation-center:pending-initial-message";

/** 附件仅存内存（含 blob URL），与 session 中的 threadId 对应；刷新页面后会丢失。 */
const pendingFilesByThreadId = new Map<string, FileUIPart[]>();

export type PendingInitialMessage = {
  threadId: string;
  text: string;
  files: FileUIPart[];
  personaId?: string | null;
  additionalKwargs?: Record<string, unknown>;
};

export type StashPendingInitialMessageInput = Omit<PendingInitialMessage, "files"> & {
  files?: FileUIPart[];
};

export function stashPendingInitialMessage(payload: StashPendingInitialMessageInput): void {
  if (typeof window === "undefined") return;
  const { files, ...serializable } = payload;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // ignore quota / private mode
  }
  if (files && files.length > 0) {
    pendingFilesByThreadId.set(payload.threadId, files);
  } else {
    pendingFilesByThreadId.delete(payload.threadId);
  }
}

/**
 * 若当前会话与暂存一致，则取出并清除暂存（仅消费一次）。
 */
export function takePendingInitialMessage(threadId: string): PendingInitialMessage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Omit<PendingInitialMessage, "files">;
    if (data.threadId !== threadId || typeof data.text !== "string") {
      return null;
    }
    const trimmed = data.text.trim();
    const files = pendingFilesByThreadId.get(threadId) ?? [];
    if (trimmed.length === 0 && files.length === 0) {
      return null;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    pendingFilesByThreadId.delete(threadId);
    const personaId =
      typeof data.personaId === "string" ? data.personaId : null;
    const additionalKwargs =
      data.additionalKwargs &&
      typeof data.additionalKwargs === "object" &&
      !Array.isArray(data.additionalKwargs)
        ? (data.additionalKwargs as Record<string, unknown>)
        : undefined;
    return {
      threadId: data.threadId,
      text: trimmed,
      files,
      personaId,
      additionalKwargs,
    };
  } catch {
    return null;
  }
}
