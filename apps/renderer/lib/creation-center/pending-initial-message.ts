const STORAGE_KEY = "creation-center:pending-initial-message";

export type PendingInitialMessage = {
  threadId: string;
  text: string;
  personaId?: string | null;
};

export function stashPendingInitialMessage(payload: PendingInitialMessage): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
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
    const data = JSON.parse(raw) as PendingInitialMessage;
    if (data.threadId !== threadId || typeof data.text !== "string") {
      return null;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    const trimmed = data.text.trim();
    if (trimmed.length === 0) return null;
    const personaId =
      typeof data.personaId === "string" ? data.personaId : null;
    return {
      threadId: data.threadId,
      text: trimmed,
      personaId,
    };
  } catch {
    return null;
  }
}
