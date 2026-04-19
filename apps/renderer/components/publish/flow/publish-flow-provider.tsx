"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { buildPublishEditPayload } from "@/lib/api/publish";
import { getApiErrorMessage } from "@/lib/request";

import type {
  BeginArtifactPublishParams,
  PublishEditCacheEntry,
  PublishPreviewPayload,
} from "./types";

const PUBLISH_DRAWER_CLOSE_ANIMATION_MS = 320;

type PublishFlowContextValue = {
  beginArtifactPublish: (params: BeginArtifactPublishParams) => Promise<void>;
  isPreparingPublishPreview: boolean;
  publishPreview: PublishPreviewPayload | null;
  closePublishPreview: () => void;
  publishAccountsOpen: boolean;
  setPublishAccountsOpen: (open: boolean) => void;
  confirmPublishAccounts: (selectedAccountIds: string[]) => void;
};

const PublishFlowContext = createContext<PublishFlowContextValue | undefined>(
  undefined,
);

function getArtifactPublishKey(threadId: string, artifactPath: string) {
  return `${threadId}\u001f${artifactPath}`;
}

function getPublishEditCacheKey(
  threadId: string,
  artifactPath: string,
  accountIds: string[],
) {
  const normalizedIds = [...accountIds].sort().join(",");
  return `${threadId}\u001f${artifactPath}\u001f${normalizedIds}`;
}

export function PublishFlowProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [publishPreview, setPublishPreview] =
    useState<PublishPreviewPayload | null>(null);
  const [publishAccountsOpen, setPublishAccountsOpen] = useState(false);
  const [publishSource, setPublishSource] =
    useState<BeginArtifactPublishParams | null>(null);
  const [isPreparingPublishPreview, setIsPreparingPublishPreview] =
    useState(false);
  const [selectedAccountIdsByArtifact, setSelectedAccountIdsByArtifact] =
    useState<Record<string, string[]>>({});
  const [publishEditCacheBySelection, setPublishEditCacheBySelection] =
    useState<Record<string, PublishEditCacheEntry>>({});

  const preparePublishPreview = useCallback(
    async (
      params: BeginArtifactPublishParams,
      selectedAccountIds: string[],
    ) => {
      if (selectedAccountIds.length === 0) return;
      if (isPreparingPublishPreview) return;

      const cacheKey = getPublishEditCacheKey(
        params.threadId,
        params.artifactPath,
        selectedAccountIds,
      );
      const cachedEntry = publishEditCacheBySelection[cacheKey];
      if (
        cachedEntry &&
        cachedEntry.markdownSnapshot === params.markdownSnapshot
      ) {
        setPublishPreview({
          ...params,
          selectedAccountIds,
          publishEdit: cachedEntry.publishEdit,
        });
        return;
      }

      setIsPreparingPublishPreview(true);
      try {
        const publishEdit = await buildPublishEditPayload({
          threadId: params.threadId,
          artifacts: params.artifactPath,
          accountIds: selectedAccountIds,
        });
        setPublishEditCacheBySelection((previous) => ({
          ...previous,
          [cacheKey]: {
            publishEdit,
            markdownSnapshot: params.markdownSnapshot,
          },
        }));
        setPublishPreview({
          ...params,
          selectedAccountIds,
          publishEdit,
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "加载发布配置失败"));
      } finally {
        setIsPreparingPublishPreview(false);
      }
    },
    [isPreparingPublishPreview, publishEditCacheBySelection],
  );

  const beginArtifactPublish = useCallback(
    async (params: BeginArtifactPublishParams) => {
      const artifactKey = getArtifactPublishKey(
        params.threadId,
        params.artifactPath,
      );
      const selectedAccountIds = selectedAccountIdsByArtifact[artifactKey] ?? [];

      setPublishSource(params);

      if (selectedAccountIds.length > 0) {
        await preparePublishPreview(params, selectedAccountIds);
        return;
      }

      setPublishAccountsOpen(true);
    },
    [preparePublishPreview, selectedAccountIdsByArtifact],
  );

  const confirmPublishAccounts = useCallback(
    (selectedAccountIds: string[]) => {
      if (!publishSource) return;
      const artifactKey = getArtifactPublishKey(
        publishSource.threadId,
        publishSource.artifactPath,
      );

      setSelectedAccountIdsByArtifact((previous) => ({
        ...previous,
        [artifactKey]: selectedAccountIds,
      }));

      setTimeout(() => {
        void preparePublishPreview(publishSource, selectedAccountIds);
      }, PUBLISH_DRAWER_CLOSE_ANIMATION_MS);
    },
    [preparePublishPreview, publishSource],
  );

  const value = useMemo<PublishFlowContextValue>(
    () => ({
      beginArtifactPublish,
      isPreparingPublishPreview,
      publishPreview,
      closePublishPreview: () => {
        setPublishPreview(null);
      },
      publishAccountsOpen,
      setPublishAccountsOpen: (open: boolean) => {
        setPublishAccountsOpen(open);
      },
      confirmPublishAccounts,
    }),
    [
      beginArtifactPublish,
      confirmPublishAccounts,
      isPreparingPublishPreview,
      publishAccountsOpen,
      publishPreview,
    ],
  );

  return (
    <PublishFlowContext.Provider value={value}>
      {children}
    </PublishFlowContext.Provider>
  );
}

export function usePublishFlow() {
  const context = useContext(PublishFlowContext);
  if (!context) {
    throw new Error("usePublishFlow must be used within a PublishFlowProvider");
  }
  return context;
}
