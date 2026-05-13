import { getBackendBaseURL } from "../config";
import type { AgentThread } from "../threads";

export function urlOfArtifact({
  filepath,
  threadId,
  download = false,
  downloadType,
}: {
  filepath: string;
  threadId: string;
  download?: boolean;
  downloadType?: "doc";
}) {
  const params = new URLSearchParams();
  if (download) {
    params.set("download", "true");
  }
  if (downloadType) {
    params.set("type", downloadType);
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";
  return `${getBackendBaseURL()}/api/threads/${threadId}/artifacts${filepath}${query}`;
}

export function extractArtifactsFromThread(thread: AgentThread) {
  return thread.values.artifacts ?? [];
}

export function resolveArtifactURL(absolutePath: string, threadId: string) {
  return `${getBackendBaseURL()}/api/threads/${threadId}/artifacts${absolutePath}`;
}
