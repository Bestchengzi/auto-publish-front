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
  BeginDirectPublishParams,
  BeginArtifactPublishParams,
  PublishEditCacheEntry,
  PublishPreviewPayload,
} from "./types";

const PUBLISH_DRAWER_CLOSE_ANIMATION_MS = 320;
const HTML_PUBLISH_ACCOUNT_PLATFORM_IDS = ["wechat_mp"];

type PublishFlowContextValue = {
  beginArtifactPublish: (params: BeginArtifactPublishParams) => Promise<void>;
  beginDirectPublish: (params: BeginDirectPublishParams) => Promise<void>;
  isPreparingPublishPreview: boolean;
  publishPreview: PublishPreviewPayload | null;
  closePublishPreview: () => void;
  publishAccountsOpen: boolean;
  publishAccountsAllowedPlatformIds: string[] | null;
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

function isHtmlArtifactPath(artifactPath: string) {
  const normalizedPath = artifactPath.toLowerCase().split(/[?#]/)[0] ?? "";
  return normalizedPath.endsWith(".html") || normalizedPath.endsWith(".htm");
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
  const [directPublishSource, setDirectPublishSource] =
    useState<BeginDirectPublishParams | null>(null);
  const [directPublishAllowedPlatformIds, setDirectPublishAllowedPlatformIds] =
    useState<string[] | null>(null);
  const [isPreparingPublishPreview, setIsPreparingPublishPreview] =
    useState(false);
  const [selectedAccountIdsByArtifact, setSelectedAccountIdsByArtifact] =
    useState<Record<string, string[]>>({});
  const [selectedAccountIdsByDirectPublish, setSelectedAccountIdsByDirectPublish] =
    useState<Record<string, string[]>>({});
  const [publishEditCacheBySelection, setPublishEditCacheBySelection] =
    useState<Record<string, PublishEditCacheEntry>>({});

  const preparePublishPreview = useCallback(
    async (
      params: BeginArtifactPublishParams,
      selectedAccountIds: string[],
    ) => {
      if (selectedAccountIds.length === 0) return false;
      if (isPreparingPublishPreview) return false;

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
        return true;
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
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "加载发布配置失败"));
        return false;
      } finally {
        setIsPreparingPublishPreview(false);
      }
    },
    [isPreparingPublishPreview, publishEditCacheBySelection],
  );

  const prepareDirectPublishPreview = useCallback(
    async (
      params: BeginDirectPublishParams,
      selectedAccountIds: string[],
    ) => {
      if (selectedAccountIds.length === 0) return false;
      if (isPreparingPublishPreview) return false;

      setIsPreparingPublishPreview(true);
      try {
        const publishEdit = await params.createPublishEdit(selectedAccountIds);
        setPublishPreview({
          ...params,
          selectedAccountIds,
          publishEdit,
        });
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, "加载发布配置失败"));
        return false;
      } finally {
        setIsPreparingPublishPreview(false);
      }
    },
    [isPreparingPublishPreview],
  );

  const beginArtifactPublish = useCallback(
    async (params: BeginArtifactPublishParams) => {
      setDirectPublishSource(null);
      setDirectPublishAllowedPlatformIds(null);
      const artifactKey = getArtifactPublishKey(
        params.threadId,
        params.artifactPath,
      );
      const selectedAccountIds = selectedAccountIdsByArtifact[artifactKey] ?? [];

      setPublishSource(params);

      if (selectedAccountIds.length > 0) {
        const prepared = await preparePublishPreview(params, selectedAccountIds);
        if (!prepared) {
          setSelectedAccountIdsByArtifact((previous) => {
            const next = { ...previous };
            delete next[artifactKey];
            return next;
          });
        }
        return;
      }

      setPublishAccountsOpen(true);
    },
    [preparePublishPreview, selectedAccountIdsByArtifact],
  );

  const beginDirectPublish = useCallback(
    async (params: BeginDirectPublishParams) => {
      setPublishSource(null);
      setDirectPublishSource(params);
      setDirectPublishAllowedPlatformIds(params.allowedPlatformIds ?? null);
      const directPublishKey = getArtifactPublishKey(
        params.threadId,
        params.artifactPath,
      );
      const selectedAccountIds =
        selectedAccountIdsByDirectPublish[directPublishKey] ?? [];

      if (selectedAccountIds.length > 0) {
        const prepared = await prepareDirectPublishPreview(
          params,
          selectedAccountIds,
        );
        if (!prepared) {
          setSelectedAccountIdsByDirectPublish((previous) => {
            const next = { ...previous };
            delete next[directPublishKey];
            return next;
          });
        }
        return;
      }

      setPublishAccountsOpen(true);
    },
    [prepareDirectPublishPreview, selectedAccountIdsByDirectPublish],
  );

  const confirmPublishAccounts = useCallback(
    (selectedAccountIds: string[]) => {
      if (directPublishSource) {
        const directPublishKey = getArtifactPublishKey(
          directPublishSource.threadId,
          directPublishSource.artifactPath,
        );
        setTimeout(() => {
          void prepareDirectPublishPreview(
            directPublishSource,
            selectedAccountIds,
          ).then((prepared) => {
            if (!prepared) return;
            setSelectedAccountIdsByDirectPublish((previous) => ({
              ...previous,
              [directPublishKey]: selectedAccountIds,
            }));
          });
        }, PUBLISH_DRAWER_CLOSE_ANIMATION_MS);
        return;
      }

      if (!publishSource) return;
      const artifactKey = getArtifactPublishKey(
        publishSource.threadId,
        publishSource.artifactPath,
      );

      setTimeout(() => {
        void preparePublishPreview(publishSource, selectedAccountIds).then(
          (prepared) => {
            if (!prepared) return;
            setSelectedAccountIdsByArtifact((previous) => ({
              ...previous,
              [artifactKey]: selectedAccountIds,
            }));
          },
        );
      }, PUBLISH_DRAWER_CLOSE_ANIMATION_MS);
    },
    [
      directPublishSource,
      prepareDirectPublishPreview,
      preparePublishPreview,
      publishSource,
    ],
  );

  const publishAccountsAllowedPlatformIds = useMemo(
    () =>
      directPublishAllowedPlatformIds ??
      (publishSource && isHtmlArtifactPath(publishSource.artifactPath)
        ? HTML_PUBLISH_ACCOUNT_PLATFORM_IDS
        : null),
    [directPublishAllowedPlatformIds, publishSource],
  );

  const value = useMemo<PublishFlowContextValue>(
    () => ({
      beginArtifactPublish,
      beginDirectPublish,
      isPreparingPublishPreview,
      publishPreview,
      closePublishPreview: () => {
        setPublishPreview(null);
        setDirectPublishAllowedPlatformIds(null);
      },
      publishAccountsOpen,
      publishAccountsAllowedPlatformIds,
      setPublishAccountsOpen: (open: boolean) => {
        setPublishAccountsOpen(open);
      },
      confirmPublishAccounts,
    }),
    [
      beginArtifactPublish,
      beginDirectPublish,
      confirmPublishAccounts,
      isPreparingPublishPreview,
      publishAccountsAllowedPlatformIds,
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
