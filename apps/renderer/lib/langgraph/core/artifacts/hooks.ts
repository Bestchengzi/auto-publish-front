import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useThread } from "@/components/langgraph/workspace/messages/context";

import { loadArtifactContent, loadArtifactContentFromToolCall } from "./loader";

export function useArtifactContent({
  filepath,
  threadId,
  refreshKey = 0,
  enabled,
}: {
  filepath: string;
  threadId: string;
  refreshKey?: number;
  enabled?: boolean;
}) {
  const isWriteFile = useMemo(() => {
    return filepath.startsWith("write-file:");
  }, [filepath]);
  const { thread } = useThread();
  const content = useMemo(() => {
    if (isWriteFile) {
      return loadArtifactContentFromToolCall({ url: filepath, thread });
    }
    return null;
  }, [filepath, isWriteFile, thread]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["artifact", filepath, threadId, refreshKey],
    queryFn: () => {
      return loadArtifactContent({ filepath, threadId });
    },
    enabled,
    // Keep each selection snapshot cached briefly; manual reselection changes refreshKey and refetches.
    staleTime: 5 * 60 * 1000,
  });
  return { content: isWriteFile ? content : data, isLoading, error };
}
