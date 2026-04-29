"use client";

import {
  ChevronLeftIcon,
  Loader2Icon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ImagePickerSheet } from "@/components/common/image-picker-sheet";
import {
  PlatformPickerDialog,
} from "@/components/common/platform-picker-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PublishEditAccount,
  PublishEditPlatform,
  PublishPlatformRequest,
  PublishSummary,
} from "@/lib/api/publish";
import {
  parsePublishThreadResponse,
  publishThreadArticle,
} from "@/lib/api/publish";
import * as accountsApi from "@/lib/api/accounts";
import * as mediaApi from "@/lib/api/media";
import { getBackendBaseURL } from "@/lib/langgraph/core/config";
import { getUploadPreviewUrl, uploadFiles } from "@/lib/langgraph/core/uploads/api";
import { getApiErrorMessage, request } from "@/lib/request";
import { cn } from "@/lib/utils";

import {
  createInitialCoverImages,
  createInitialFormValues,
  getAddPlatformDialogCopy,
  getCoverSlotCount,
  getDefaultPlatformOptions,
  getOrderedPlatformOptions,
  getPlatformRequiredAccountError,
  getPublishFieldLabelByPlatform,
  getPublishPlatformLabel,
  getPublishPlatformLogoPath,
  getPublishPlatformModule,
  getPublishPlatformPickerItems,
  getPublishResultPlatformLabel,
  getRequiredFieldErrorMessage,
  getRequiredFields,
  getTitleMaxLength,
  isInlinePlatformField,
  normalizePlatformOptions,
  validatePlatformBeforePublish,
} from "../platforms/registry";
import {
  FIELD_ID_ACCOUNT,
  FIELD_ID_TITLE,
  extractImageUrlsFromContent,
  extractTitleFromMarkdown,
  toAccountPlatform,
} from "../platforms/utils";
import type { PublishPreviewPayload } from "./types";

const COVER_PICKER_TAB_UPLOAD = "upload";
const COVER_PICKER_TAB_LIBRARY = "library";
const COVER_PICKER_TAB_PROJECT = "project";
const COVER_PICKER_TAB_SEARCH = "search";
const HTML_PUBLISH_PLATFORM_ID = "wechat_mp";

type PublishPanelDraftSnapshot = {
  activePublishPlatform: string;
  formValuesByPlatform: Record<string, Record<string, unknown>>;
  formTouchedByPlatform: Record<string, Record<string, boolean>>;
  formErrorsByPlatform: Record<string, Record<string, string>>;
  selectedAccountIdsByPlatform: Record<string, string[]>;
  coverImagesByPlatform: Record<string, string[]>;
  dismissedPublishPlatforms: string[];
  addedPlatformDataById: Record<string, PublishEditPlatform>;
};

type ArtifactListItem = {
  filename: string;
  artifact_url: string;
  file_type: "document" | "image" | "video" | "other";
};

type ArtifactListResponse = {
  files: ArtifactListItem[];
};

type ImageSearchResponse = {
  results?: Array<{
    title?: string;
    image_url?: string;
    thumbnail_url?: string;
    source_url?: string;
  }>;
};

function publishDraftKey(threadId: string, artifactPath: string) {
  return `${threadId}\u001f${artifactPath}`;
}

function isHtmlArtifactPath(artifactPath: string) {
  const normalizedPath = artifactPath.toLowerCase().split(/[?#]/)[0] ?? "";
  return normalizedPath.endsWith(".html") || normalizedPath.endsWith(".htm");
}

function withHiddenPreviewScrollbars(html: string) {
  const readonlyHtml = html
    .replace(/\scontenteditable(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "")
    .replace(/\sspellcheck(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "");
  const style = `
    <style id="publish-preview-scrollbar-style">
      :where(*) {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      :where(*)::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }
    </style>
  `;
  if (/<\/head\s*>/i.test(readonlyHtml)) {
    return readonlyHtml.replace(/<\/head\s*>/i, `${style}</head>`);
  }
  return `${style}${readonlyHtml}`;
}

function getPlatformPublishTitle(platformData: PublishEditPlatform) {
  const optionTitle = platformData.platform_options?.title;
  if (typeof optionTitle === "string" && optionTitle.trim()) {
    return optionTitle.trim();
  }
  return extractTitleFromMarkdown(platformData.content);
}

export function PublishOverlay({
  publishPreview,
  closePublishPreview,
}: {
  publishPreview: PublishPreviewPayload | null;
  closePublishPreview: () => void;
}) {
  const tLanggraph = useTranslations("langgraph");
  const td = useCallback(
    (
      key: string,
      fallback: string,
      values?: Record<string, string | number>,
    ) => {
      const fullKey = `coverDrawer.${key}`;
      if (!tLanggraph.has(fullKey)) return fallback;
      return values ? tLanggraph(fullKey, values) : tLanggraph(fullKey);
    },
    [tLanggraph],
  );

  const [activePublishPlatform, setActivePublishPlatform] = useState("");
  const [formValuesByPlatform, setFormValuesByPlatform] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [formTouchedByPlatform, setFormTouchedByPlatform] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [formErrorsByPlatform, setFormErrorsByPlatform] = useState<
    Record<string, Record<string, string>>
  >({});
  const [selectedAccountIdsByPlatform, setSelectedAccountIdsByPlatform] =
    useState<Record<string, string[]>>({});
  const [coverImagesByPlatform, setCoverImagesByPlatform] = useState<
    Record<string, string[]>
  >({});
  const [coverDrawerOpen, setCoverDrawerOpen] = useState(false);
  const [coverDrawerSession, setCoverDrawerSession] = useState(0);
  const [coverDrawerTab, setCoverDrawerTab] = useState<
    | typeof COVER_PICKER_TAB_UPLOAD
    | typeof COVER_PICKER_TAB_LIBRARY
    | typeof COVER_PICKER_TAB_PROJECT
    | typeof COVER_PICKER_TAB_SEARCH
  >(COVER_PICKER_TAB_UPLOAD);
  const [coverReplaceIndex, setCoverReplaceIndex] = useState<number | null>(
    null,
  );
  const [coverUploadCandidates, setCoverUploadCandidates] = useState<string[]>(
    [],
  );
  const [coverLibraryCandidates, setCoverLibraryCandidates] = useState<string[]>(
    [],
  );
  const [coverProjectCandidates, setCoverProjectCandidates] = useState<string[]>(
    [],
  );
  const [coverSearchCandidates, setCoverSearchCandidates] = useState<string[]>(
    [],
  );
  const [coverSearchInputValue, setCoverSearchInputValue] = useState("");
  const [coverSearchCommittedQuery, setCoverSearchCommittedQuery] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverReuploadTargetIndex, setCoverReuploadTargetIndex] = useState<
    number | null
  >(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResultSummary, setPublishResultSummary] =
    useState<PublishSummary | null>(null);
  const [addPlatformOpen, setAddPlatformOpen] = useState(false);
  const [publishPanelAnimatedIn, setPublishPanelAnimatedIn] = useState(false);
  const [dismissedPublishPlatforms, setDismissedPublishPlatforms] = useState<
    Set<string>
  >(new Set());
  const [addedPlatformDataById, setAddedPlatformDataById] = useState<
    Record<string, PublishEditPlatform>
  >({});
  const isHtmlPublishPreview = useMemo(
    () => isHtmlArtifactPath(publishPreview?.artifactPath ?? ""),
    [publishPreview?.artifactPath],
  );
  const htmlPreviewSrcDoc = useMemo(
    () =>
      publishPreview && isHtmlPublishPreview
        ? withHiddenPreviewScrollbars(publishPreview.contentHtml)
        : "",
    [isHtmlPublishPreview, publishPreview],
  );
  const publishFailedDetails = useMemo(
    () =>
      publishResultSummary?.details.filter(
        (detail) => detail.publish_status === "failed",
      ) ?? [],
    [publishResultSummary],
  );
  const coverUploadInputRef = useRef<HTMLInputElement>(null);
  const coverReuploadInputRef = useRef<HTMLInputElement>(null);
  const publishPanelStateRef = useRef<PublishPanelDraftSnapshot>({
    activePublishPlatform: "",
    formValuesByPlatform: {},
    formTouchedByPlatform: {},
    formErrorsByPlatform: {},
    selectedAccountIdsByPlatform: {},
    coverImagesByPlatform: {},
    dismissedPublishPlatforms: [],
    addedPlatformDataById: {},
  });
  const publishDraftsRef = useRef(
    new Map<string, PublishPanelDraftSnapshot>(),
  );
  const publishDraftSessionKeyRef = useRef("");
  const suppressPublishDraftSaveRef = useRef(false);

  useEffect(() => {
    if (coverDrawerOpen) {
      setCoverDrawerSession((current) => current + 1);
    }
  }, [coverDrawerOpen]);

  useEffect(() => {
    publishPanelStateRef.current = {
      activePublishPlatform,
      formValuesByPlatform,
      formTouchedByPlatform,
      formErrorsByPlatform,
      selectedAccountIdsByPlatform,
      coverImagesByPlatform,
      dismissedPublishPlatforms: Array.from(dismissedPublishPlatforms),
      addedPlatformDataById,
    };
  }, [
    activePublishPlatform,
    addedPlatformDataById,
    coverImagesByPlatform,
    dismissedPublishPlatforms,
    formErrorsByPlatform,
    formTouchedByPlatform,
    formValuesByPlatform,
    selectedAccountIdsByPlatform,
  ]);

  useEffect(() => {
    const publishEdit = publishPreview?.publishEdit;
    const nextKey =
      publishEdit?.artifacts && publishPreview
        ? publishDraftKey(publishEdit.thread_id, publishEdit.artifacts)
        : "";

    if (nextKey === publishDraftSessionKeyRef.current) {
      return;
    }

    const previousKey = publishDraftSessionKeyRef.current;
    if (previousKey && !suppressPublishDraftSaveRef.current) {
      publishDraftsRef.current.set(previousKey, {
        ...publishPanelStateRef.current,
      });
    }
    suppressPublishDraftSaveRef.current = false;

    publishDraftSessionKeyRef.current = nextKey;

    if (!nextKey) {
      setActivePublishPlatform("");
      setFormValuesByPlatform({});
      setFormTouchedByPlatform({});
      setFormErrorsByPlatform({});
      setSelectedAccountIdsByPlatform({});
      setCoverImagesByPlatform({});
      setDismissedPublishPlatforms(new Set());
      setAddedPlatformDataById({});
      return;
    }

    const snapshot = publishDraftsRef.current.get(nextKey);
    if (snapshot) {
      setActivePublishPlatform(snapshot.activePublishPlatform);
      setFormValuesByPlatform(snapshot.formValuesByPlatform);
      setFormTouchedByPlatform(snapshot.formTouchedByPlatform);
      setFormErrorsByPlatform(snapshot.formErrorsByPlatform);
      setSelectedAccountIdsByPlatform(snapshot.selectedAccountIdsByPlatform);
      setCoverImagesByPlatform(snapshot.coverImagesByPlatform);
      setDismissedPublishPlatforms(
        new Set(snapshot.dismissedPublishPlatforms ?? []),
      );
      setAddedPlatformDataById(snapshot.addedPlatformDataById ?? {});
      return;
    }

    setActivePublishPlatform("");
    setFormValuesByPlatform({});
    setFormTouchedByPlatform({});
    setFormErrorsByPlatform({});
    setSelectedAccountIdsByPlatform({});
    setCoverImagesByPlatform({});
    setDismissedPublishPlatforms(new Set());
    setAddedPlatformDataById({});
  }, [publishPreview]);

  useEffect(() => {
    if (!publishPreview) {
      setPublishPanelAnimatedIn(false);
      return;
    }

    setPublishPanelAnimatedIn(false);
    const rafId = requestAnimationFrame(() => {
      setPublishPanelAnimatedIn(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, [publishPreview]);

  const publishPlatformMap = useMemo(
    () => ({
      ...(publishPreview?.publishEdit.platform ?? {}),
      ...addedPlatformDataById,
    }),
    [addedPlatformDataById, publishPreview],
  );
  const publishPlatformEntries = useMemo(
    () => Object.entries(publishPlatformMap),
    [publishPlatformMap],
  );
  const visiblePublishPlatformEntries = useMemo(
    () =>
      publishPlatformEntries.filter(
        ([platformKey]) => !dismissedPublishPlatforms.has(platformKey),
      ),
    [dismissedPublishPlatforms, publishPlatformEntries],
  );
  const visiblePublishPlatformIdSet = useMemo(
    () => new Set(visiblePublishPlatformEntries.map(([platformKey]) => platformKey)),
    [visiblePublishPlatformEntries],
  );
  const pickerPlatforms = useMemo(() => {
    const items = getPublishPlatformPickerItems();
    if (!isHtmlPublishPreview) return items;
    return items.filter((item) => item.id === HTML_PUBLISH_PLATFORM_ID);
  }, [isHtmlPublishPreview]);
  const addPlatformDialogCopy = useMemo(() => getAddPlatformDialogCopy(), []);

  const { data: allAccountsRes } = useQuery({
    queryKey: ["publish-panel", "all-accounts"],
    queryFn: () => accountsApi.listAccounts(),
    enabled: !!publishPreview,
  });

  useEffect(() => {
    if (visiblePublishPlatformEntries.length === 0) {
      setActivePublishPlatform("");
      return;
    }

    setActivePublishPlatform((current) => {
      if (
        current &&
        visiblePublishPlatformEntries.some(([platformKey]) => platformKey === current)
      ) {
        return current;
      }
      return visiblePublishPlatformEntries[0]?.[0] ?? "";
    });
  }, [visiblePublishPlatformEntries]);

  const activePlatformData = useMemo<PublishEditPlatform | null>(() => {
    if (!activePublishPlatform) return null;
    return publishPlatformMap[activePublishPlatform] ?? null;
  }, [activePublishPlatform, publishPlatformMap]);
  const availableAccountsForActivePlatform = useMemo(() => {
    const items = allAccountsRes?.items ?? [];
    const platform = toAccountPlatform(activePublishPlatform);
    return items.filter((account) => account.platform === platform);
  }, [activePublishPlatform, allAccountsRes]);
  const publishTitle = useMemo(() => {
    if (!activePlatformData) return "";
    return getPlatformPublishTitle(activePlatformData);
  }, [activePlatformData]);
  const orderedPlatformOptions = useMemo(() => {
    if (!activePublishPlatform || !activePlatformData) return [];
    return getOrderedPlatformOptions(activePublishPlatform, activePlatformData);
  }, [activePlatformData, activePublishPlatform]);

  const activeFormValues = useMemo(
    () => formValuesByPlatform[activePublishPlatform] ?? {},
    [activePublishPlatform, formValuesByPlatform],
  );
  const activeFormTouched = useMemo(
    () => formTouchedByPlatform[activePublishPlatform] ?? {},
    [activePublishPlatform, formTouchedByPlatform],
  );
  const activeFormErrors = useMemo(
    () => formErrorsByPlatform[activePublishPlatform] ?? {},
    [activePublishPlatform, formErrorsByPlatform],
  );
  const activeSelectedAccountIds = useMemo(
    () => selectedAccountIdsByPlatform[activePublishPlatform] ?? [],
    [activePublishPlatform, selectedAccountIdsByPlatform],
  );
  const activeCoverImages = useMemo(
    () => coverImagesByPlatform[activePublishPlatform] ?? [],
    [activePublishPlatform, coverImagesByPlatform],
  );
  const titleMaxLength = getTitleMaxLength(activePublishPlatform);
  const coverSlotCount = getCoverSlotCount(
    activePublishPlatform,
    activeFormValues,
  );
  const remainingCoverSlots = Math.max(
    coverSlotCount - activeCoverImages.length,
    0,
  );
  const coverSelectableCount =
    coverReplaceIndex != null ? 1 : remainingCoverSlots;

  const { data: coverLibraryItems = [], isFetching: isFetchingCoverLibrary } =
    useQuery({
      queryKey: ["publish-panel", "cover-library-images", coverDrawerSession],
      queryFn: async () => {
        const response = await mediaApi.listMedia({ media_type: "image" });
        return response.items.map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
        }));
      },
      enabled: coverDrawerOpen,
    });

  const { data: coverProjectItems = [], isFetching: isFetchingCoverProject } =
    useQuery({
      queryKey: [
        "publish-panel",
        "cover-project-images",
        publishPreview?.publishEdit.thread_id,
        coverDrawerSession,
      ],
      queryFn: async () => {
        const response = await request<ArtifactListResponse>(
          `${getBackendBaseURL()}/api/threads/${publishPreview?.publishEdit.thread_id}/artifacts/list?file_type=image`,
        );
        return (response.files ?? [])
          .filter((item) => item.file_type === "image")
          .map((item) => ({
            id: `${item.filename}-${item.artifact_url}`,
            name: item.filename,
            url:
              getUploadPreviewUrl({ artifact_url: item.artifact_url }) ??
              item.artifact_url,
          }));
      },
      enabled: coverDrawerOpen && !!publishPreview?.publishEdit.thread_id,
    });

  const { data: coverSearchItems = [], isFetching: isFetchingCoverSearch } =
    useQuery({
      queryKey: [
        "publish-panel",
        "cover-image-search",
        coverSearchCommittedQuery,
        coverDrawerSession,
      ],
      queryFn: async () => {
        const response = await request<ImageSearchResponse>(
          `${getBackendBaseURL()}/api/tools/image_search?query=${encodeURIComponent(
            coverSearchCommittedQuery,
          )}&max_results=40`,
        );
        return (response.results ?? [])
          .map((item, index) => {
            const thumbnailUrl = (item.thumbnail_url ?? "").trim();
            const fallbackUrl = (item.image_url ?? "").trim();
            const url = thumbnailUrl || fallbackUrl;
            if (!url) return null;
            return {
              id: `${index}-${url}`,
              name:
                item.title?.trim() ||
                item.source_url?.trim() ||
                `image-${index + 1}`,
              url,
            };
          })
          .filter(
            (item): item is { id: string; name: string; url: string } =>
              Boolean(item),
          );
      },
      enabled: coverDrawerOpen && coverSearchCommittedQuery.trim().length > 0,
    });

  useEffect(() => {
    if (!activePublishPlatform || !activePlatformData) return;
    const contentImageUrls = extractImageUrlsFromContent(
      activePlatformData.content,
    ).slice(0, 3);

    setFormValuesByPlatform((previous) => {
      if (previous[activePublishPlatform]) return previous;
      return {
        ...previous,
        [activePublishPlatform]: createInitialFormValues(activePublishPlatform, {
          platformData: activePlatformData,
          orderedOptions: orderedPlatformOptions,
          title: publishTitle,
          contentImageUrls,
        }),
      };
    });

    setSelectedAccountIdsByPlatform((previous) => {
      if (previous[activePublishPlatform]) return previous;
      return {
        ...previous,
        [activePublishPlatform]: activePlatformData.accounts.map(
          (account) => account.id,
        ),
      };
    });

    setCoverImagesByPlatform((previous) => {
      if (previous[activePublishPlatform]) return previous;
      return {
        ...previous,
        [activePublishPlatform]: createInitialCoverImages(activePublishPlatform, {
          platformData: activePlatformData,
          orderedOptions: orderedPlatformOptions,
          title: publishTitle,
          contentImageUrls,
        }),
      };
    });
  }, [
    activePlatformData,
    activePublishPlatform,
    orderedPlatformOptions,
    publishTitle,
  ]);

  const handleFieldChange = useCallback(
    (fieldKey: string, value: unknown) => {
      if (!activePublishPlatform) return;
      setFormValuesByPlatform((previous) => ({
        ...previous,
        [activePublishPlatform]: {
          ...(previous[activePublishPlatform] ?? {}),
          [fieldKey]: value,
        },
      }));
    },
    [activePublishPlatform],
  );

  const handleFieldBlur = useCallback(
    (fieldKey: string) => {
      if (!activePublishPlatform) return;

      setFormTouchedByPlatform((previous) => ({
        ...previous,
        [activePublishPlatform]: {
          ...(previous[activePublishPlatform] ?? {}),
          [fieldKey]: true,
        },
      }));

      if (fieldKey === FIELD_ID_ACCOUNT) {
        setFormErrorsByPlatform((previous) => ({
          ...previous,
          [activePublishPlatform]: {
            ...(previous[activePublishPlatform] ?? {}),
            [FIELD_ID_ACCOUNT]:
              activeSelectedAccountIds.length > 0 ? "" : "请选择发布账号",
          },
        }));
        return;
      }

      const requiredFields = new Set([
        FIELD_ID_TITLE,
        ...getRequiredFields(activePublishPlatform),
      ]);
      if (!requiredFields.has(fieldKey)) return;

      const nextError = getRequiredFieldErrorMessage(
        activePublishPlatform,
        fieldKey,
        activeFormValues[fieldKey],
      );
      setFormErrorsByPlatform((previous) => ({
        ...previous,
        [activePublishPlatform]: {
          ...(previous[activePublishPlatform] ?? {}),
          [fieldKey]: nextError,
        },
      }));
    },
    [activeFormValues, activePublishPlatform, activeSelectedAccountIds.length],
  );

  const handleAccountSelectionChange = useCallback(
    (nextAccountIds: string[]) => {
      if (!activePublishPlatform) return;

      setSelectedAccountIdsByPlatform((previous) => ({
        ...previous,
        [activePublishPlatform]: nextAccountIds,
      }));

      if (activeFormTouched[FIELD_ID_ACCOUNT]) {
        setFormErrorsByPlatform((previous) => ({
          ...previous,
          [activePublishPlatform]: {
            ...(previous[activePublishPlatform] ?? {}),
            [FIELD_ID_ACCOUNT]:
              nextAccountIds.length > 0 ? "" : "请选择发布账号",
          },
        }));
      }
    },
    [activeFormTouched, activePublishPlatform],
  );

  const handleRemoveCoverImage = useCallback(
    (index: number) => {
      if (!activePublishPlatform) return;
      setCoverImagesByPlatform((previous) => {
        const currentImages = previous[activePublishPlatform] ?? [];
        if (index < 0 || index >= currentImages.length) return previous;
        return {
          ...previous,
          [activePublishPlatform]: currentImages.filter(
            (_, imageIndex) => imageIndex !== index,
          ),
        };
      });
    },
    [activePublishPlatform],
  );

  const resetCoverDrawerSelection = useCallback(() => {
    setCoverDrawerTab(COVER_PICKER_TAB_UPLOAD);
    setCoverUploadCandidates([]);
    setCoverLibraryCandidates([]);
    setCoverProjectCandidates([]);
    setCoverSearchCandidates([]);
    setCoverSearchInputValue("");
    setCoverSearchCommittedQuery("");
    setCoverReuploadTargetIndex(null);
  }, []);

  const openCoverDrawerForAdd = useCallback(() => {
    if (coverSelectableCount <= 0) {
      toast.error("当前封面数量已达上限");
      return;
    }
    setCoverReplaceIndex(null);
    resetCoverDrawerSelection();
    setCoverDrawerOpen(true);
  }, [coverSelectableCount, resetCoverDrawerSelection]);

  const openCoverDrawerForReplace = useCallback(
    (index: number) => {
      setCoverReplaceIndex(index);
      resetCoverDrawerSelection();
      setCoverDrawerOpen(true);
    },
    [resetCoverDrawerSelection],
  );

  const applyCoverSelection = useCallback(
    (urls: string[]) => {
      if (!activePublishPlatform || urls.length === 0) return;

      if (coverReplaceIndex != null) {
        const replacement = urls[0];
        if (!replacement) return;
        setCoverImagesByPlatform((previous) => {
          const currentImages = previous[activePublishPlatform] ?? [];
          if (
            coverReplaceIndex < 0 ||
            coverReplaceIndex >= currentImages.length
          ) {
            return previous;
          }
          const nextImages = [...currentImages];
          nextImages[coverReplaceIndex] = replacement;
          return {
            ...previous,
            [activePublishPlatform]: nextImages,
          };
        });
        setCoverDrawerOpen(false);
        return;
      }

      const appendableCount = Math.max(
        coverSlotCount - activeCoverImages.length,
        0,
      );
      const appendUrls = urls.slice(0, appendableCount);
      if (appendUrls.length === 0) return;

      setCoverImagesByPlatform((previous) => {
        const currentImages = previous[activePublishPlatform] ?? [];
        const nextImages =
          coverSlotCount <= 1
            ? appendUrls.length > 0
              ? [appendUrls[0]!]
              : currentImages.slice(0, 1)
            : [...currentImages, ...appendUrls];

        return {
          ...previous,
          [activePublishPlatform]: nextImages,
        };
      });
      setCoverDrawerOpen(false);
    },
    [
      activeCoverImages.length,
      activePublishPlatform,
      coverReplaceIndex,
      coverSlotCount,
    ],
  );

  const onPickLocalUploadFiles = useCallback(
    async (files: FileList | null) => {
      const threadId = publishPreview?.publishEdit.thread_id;
      if (!files?.length || !threadId) return;

      const maxCount =
        coverReplaceIndex != null
          ? 1
          : Math.max(
              coverSelectableCount - coverUploadCandidates.length,
              0,
            );
      if (maxCount <= 0) {
        toast.error("可选择封面数量已达上限");
        return;
      }

      const selectedFiles = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, maxCount);
      if (selectedFiles.length === 0) {
        toast.error("请选择图片文件");
        return;
      }

      setCoverUploading(true);
      try {
        const response = await uploadFiles(threadId, selectedFiles);
        const nextUrls = (response.files ?? [])
          .map((file) => getUploadPreviewUrl(file))
          .filter(
            (url): url is string => typeof url === "string" && url.length > 0,
          );
        if (nextUrls.length === 0) {
          toast.error("上传成功，但未获取到图片地址");
          return;
        }

        if (coverReuploadTargetIndex != null) {
          const nextUrl = nextUrls[0];
          if (!nextUrl) return;
          setCoverUploadCandidates((previous) => {
            const nextCandidates = [...previous];
            if (
              coverReuploadTargetIndex < 0 ||
              coverReuploadTargetIndex >= nextCandidates.length
            ) {
              return previous;
            }
            nextCandidates[coverReuploadTargetIndex] = nextUrl;
            return nextCandidates;
          });
          setCoverReuploadTargetIndex(null);
          return;
        }

        if (coverReplaceIndex != null) {
          setCoverUploadCandidates([nextUrls[0]!]);
          return;
        }

        setCoverUploadCandidates((previous) =>
          [...previous, ...nextUrls].slice(0, coverSelectableCount),
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error, "上传失败"));
      } finally {
        setCoverUploading(false);
      }
    },
    [
      coverReplaceIndex,
      coverReuploadTargetIndex,
      coverSelectableCount,
      coverUploadCandidates.length,
      publishPreview?.publishEdit.thread_id,
    ],
  );

  const toggleCoverLibraryCandidate = useCallback(
    (url: string) => {
      setCoverLibraryCandidates((previous) => {
        const exists = previous.includes(url);
        if (exists) return previous.filter((item) => item !== url);
        if (coverReplaceIndex != null) return [url];
        if (previous.length >= coverSelectableCount) return previous;
        return [...previous, url];
      });
    },
    [coverReplaceIndex, coverSelectableCount],
  );

  const toggleCoverProjectCandidate = useCallback(
    (url: string) => {
      setCoverProjectCandidates((previous) => {
        const exists = previous.includes(url);
        if (exists) return previous.filter((item) => item !== url);
        if (coverReplaceIndex != null) return [url];
        if (previous.length >= coverSelectableCount) return previous;
        return [...previous, url];
      });
    },
    [coverReplaceIndex, coverSelectableCount],
  );

  const toggleCoverSearchCandidate = useCallback(
    (url: string) => {
      setCoverSearchCandidates((previous) => {
        const exists = previous.includes(url);
        if (exists) return previous.filter((item) => item !== url);
        if (coverReplaceIndex != null) return [url];
        if (previous.length >= coverSelectableCount) return previous;
        return [...previous, url];
      });
    },
    [coverReplaceIndex, coverSelectableCount],
  );

  const triggerCoverImageSearch = useCallback(() => {
    const nextQuery = coverSearchInputValue.trim();
    if (!nextQuery) {
      toast.error(td("searchKeywordRequired", "请输入图片搜索关键词"));
      return;
    }
    setCoverSearchCandidates([]);
    setCoverSearchCommittedQuery(nextQuery);
  }, [coverSearchInputValue, td]);

  const handlePublish = useCallback(async () => {
    const publishEdit = publishPreview?.publishEdit;
    if (!publishEdit?.thread_id || visiblePublishPlatformEntries.length === 0) {
      return;
    }
    if (isPublishing) return;

    const payloadPlatforms: Record<string, PublishPlatformRequest> = {};

    for (const [platformKey, platformData] of visiblePublishPlatformEntries) {
      const orderedOptions = getOrderedPlatformOptions(platformKey, platformData);
      const rawFormValues = formValuesByPlatform[platformKey];
      const defaultTitle = getPlatformPublishTitle(platformData);
      const contentImageUrls = extractImageUrlsFromContent(platformData.content).slice(
        0,
        3,
      );
      const formValues =
        rawFormValues ??
        createInitialFormValues(platformKey, {
          platformData,
          orderedOptions,
          title: defaultTitle,
          contentImageUrls,
        });
      const accountIds =
        selectedAccountIdsByPlatform[platformKey] ??
        platformData.accounts.map((account) => account.id);
      const coverImages =
        coverImagesByPlatform[platformKey] ??
        createInitialCoverImages(platformKey, {
          platformData,
          orderedOptions,
          title: defaultTitle,
          contentImageUrls,
        });

      if (accountIds.length === 0) {
        toast.error(getPlatformRequiredAccountError(platformKey));
        return;
      }

      const titleValue = String(formValues[FIELD_ID_TITLE] ?? "").trim();
      if (!titleValue) {
        toast.error(`请输入${getPublishPlatformLabel(platformKey)}标题`);
        return;
      }

      const titleError = getRequiredFieldErrorMessage(
        platformKey,
        FIELD_ID_TITLE,
        titleValue,
      );
      if (titleError) {
        toast.error(`${getPublishPlatformLabel(platformKey)}${titleError}`);
        return;
      }

      for (const requiredField of getRequiredFields(platformKey)) {
        const fieldError = getRequiredFieldErrorMessage(
          platformKey,
          requiredField,
          formValues[requiredField],
        );
        if (fieldError) {
          toast.error(fieldError);
          return;
        }
      }

      const platformValidationError = validatePlatformBeforePublish(platformKey, {
        formValues,
        selectedAccountIds: accountIds,
        coverImages,
        platformData,
      });
      if (platformValidationError) {
        toast.error(platformValidationError);
        return;
      }

      const platformOptions = normalizePlatformOptions(platformKey, {
        formValues,
        coverImages,
        platformData,
      });
      if (titleValue) {
        platformOptions.title = titleValue;
      }

      payloadPlatforms[platformKey] = {
        account_ids: accountIds,
        content: platformData.content,
        draft: platformData.draft,
        dry_run: false,
        skip_image_upload: platformData.skip_image_upload,
        timeout: platformData.timeout,
        platform_options: platformOptions,
      };
    }

    setIsPublishing(true);
    try {
      const response = await publishThreadArticle({
        threadId: publishEdit.thread_id,
        source: "renderer.publish-panel",
        payload: {
          platforms: payloadPlatforms,
        },
      });
      const summary = parsePublishThreadResponse(response);
      if (!summary) {
        toast.error("发布结果格式异常，请稍后重试");
        return;
      }

      suppressPublishDraftSaveRef.current = true;
      publishDraftsRef.current.delete(
        publishDraftKey(publishEdit.thread_id, publishEdit.artifacts),
      );
      setPublishResultSummary(summary);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "发布失败"));
    } finally {
      setIsPublishing(false);
    }
  }, [
    coverImagesByPlatform,
    formValuesByPlatform,
    isPublishing,
    publishPreview,
    selectedAccountIdsByPlatform,
    visiblePublishPlatformEntries,
  ]);

  const renderPlatformField = useCallback(
    (fieldKey: string) => {
      const platformModule = getPublishPlatformModule(activePublishPlatform);
      const renderedField = platformModule.renderField?.({
        platformKey: activePublishPlatform,
        fieldKey,
        value: activeFormValues[fieldKey],
        onChange: (value) => handleFieldChange(fieldKey, value),
        onBlur: () => handleFieldBlur(fieldKey),
        coverImages: activeCoverImages,
        openCoverPickerForAdd: openCoverDrawerForAdd,
        openCoverPickerForReplace: openCoverDrawerForReplace,
        removeCoverImage: handleRemoveCoverImage,
      });

      if (renderedField) return renderedField;

      return (
        <Input
          value={(activeFormValues[fieldKey] as string) ?? ""}
          onChange={(event) => handleFieldChange(fieldKey, event.target.value)}
          onBlur={() => handleFieldBlur(fieldKey)}
        />
      );
    },
    [
      activeCoverImages,
      activeFormValues,
      activePublishPlatform,
      handleFieldBlur,
      handleFieldChange,
      handleRemoveCoverImage,
      openCoverDrawerForAdd,
      openCoverDrawerForReplace,
    ],
  );

  const activePlatformLabel = getPublishPlatformLabel(activePublishPlatform);

  return (
    <>
      {publishPreview ? (
        <div
          className={cn(
            "absolute inset-0 z-50 flex bg-background transition-opacity duration-300 ease-out",
            publishPanelAnimatedIn ? "opacity-100" : "opacity-0",
          )}
        >
          {isPublishing ? (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/65 backdrop-blur-[2px]"
            >
              <Loader2Icon className="size-10 shrink-0 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">发布中...</span>
            </div>
          ) : null}

          <div className="relative flex w-[50%] shrink-0 items-center justify-center bg-background p-6">
            <div className="absolute left-6 top-6">
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={closePublishPreview}
              >
                <ChevronLeftIcon className="size-3.5" />
                返回对话
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <h2 className="mb-5 text-lg font-semibold text-foreground">
                发布预览
              </h2>
              <div className="w-[352px] rounded-[36px] border border-border bg-card p-4 shadow-lg">
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-muted-foreground/20" />
                <div
                  className={cn(
                    "publish-preview-scrollbar-none h-[640px] overflow-auto rounded-3xl border border-border bg-background",
                    isHtmlPublishPreview ? "p-0" : "px-4 py-5",
                  )}
                >
                  {isHtmlPublishPreview ? (
                    <iframe
                      className="block size-full border-0 bg-background"
                      sandbox="allow-same-origin"
                      srcDoc={htmlPreviewSrcDoc}
                      title={publishPreview.title}
                    />
                  ) : (
                    <div
                      className="publish-preview-typography max-w-none break-words"
                      dangerouslySetInnerHTML={{
                        __html: publishPreview.contentHtml,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="flex h-full w-[50%] flex-col border-l border-border bg-background">
            <div className="flex h-14 shrink-0 items-center justify-between px-6">
              <h2 className="text-base font-semibold">发布面板配置</h2>
              <Button
                type="button"
                size="lg"
                className="shrink-0"
                disabled={isPublishing || visiblePublishPlatformEntries.length === 0}
                onClick={() => {
                  void handlePublish();
                }}
              >
                开始发布
              </Button>
            </div>
            <div className="shrink-0 border-b border-border" />
            <div className="min-h-0 flex-1 p-6">
              {visiblePublishPlatformEntries.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-base text-muted-foreground">
                    暂无待发布平台，
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto cursor-pointer p-0 align-baseline text-base text-primary"
                      onClick={() => setAddPlatformOpen(true)}
                    >
                      添加平台
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <Tabs
                    value={activePublishPlatform}
                    onValueChange={setActivePublishPlatform}
                    className="gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <TabsList
                        variant="line"
                        className="h-auto w-full justify-start p-0"
                      >
                        {visiblePublishPlatformEntries.map(([platformKey]) => (
                          <TabsTrigger
                            key={platformKey}
                            value={platformKey}
                            className="h-8 px-2 text-sm first:pl-0 group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:bottom-[-1px] group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:left-0 group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:right-0"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <Image
                                src={getPublishPlatformLogoPath(platformKey)}
                                alt={getPublishPlatformLabel(platformKey)}
                                width={20}
                                height={20}
                                className="size-5 rounded-sm object-contain"
                              />
                              <span>{getPublishPlatformLabel(platformKey)}</span>
                              <span
                                role="button"
                                tabIndex={0}
                                className="inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label={`关闭${getPublishPlatformLabel(platformKey)}`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setDismissedPublishPlatforms((previous) => {
                                    const next = new Set(previous);
                                    next.add(platformKey);
                                    return next;
                                  });
                                }}
                                onKeyDown={(event) => {
                                  if (
                                    event.key !== "Enter" &&
                                    event.key !== " "
                                  ) {
                                    return;
                                  }
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setDismissedPublishPlatforms((previous) => {
                                    const next = new Set(previous);
                                    next.add(platformKey);
                                    return next;
                                  });
                                }}
                              >
                                <XIcon className="size-3.5 cursor-pointer" />
                              </span>
                            </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="shrink-0 cursor-pointer"
                        aria-label="添加平台"
                        onClick={() => setAddPlatformOpen(true)}
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                    </div>
                  </Tabs>

                  {activePlatformData ? (
                    <div className="mt-6 min-h-0 flex-1 space-y-8 overflow-auto pl-2 pr-6 -mr-6">
                      <div className="mt-2 flex items-start gap-4">
                        <div className="w-[7.5rem] shrink-0 pt-2 text-sm font-medium">
                          发布账号<span className="ml-0.5 text-red-500">*</span>
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <MultiSelect
                            options={availableAccountsForActivePlatform.map(
                              (account) => ({
                                value: account.id,
                                label: account.nickname || account.account,
                                avatarUrl: account.avatar,
                              }),
                            )}
                            values={activeSelectedAccountIds}
                            onValuesChange={handleAccountSelectionChange}
                            placeholder="请选择发布账号"
                            searchPlaceholder="搜索账号..."
                            onBlur={() => {
                              handleFieldBlur(FIELD_ID_ACCOUNT);
                            }}
                          />
                          {activeFormTouched[FIELD_ID_ACCOUNT] &&
                          activeFormErrors[FIELD_ID_ACCOUNT] ? (
                            <p className="pointer-events-none absolute left-0 top-full mt-1 text-xs text-red-500">
                              {activeFormErrors[FIELD_ID_ACCOUNT]}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-[7.5rem] shrink-0 pt-2 text-sm font-medium">
                          标题<span className="ml-0.5 text-red-500">*</span>
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <Input
                            value={(activeFormValues[FIELD_ID_TITLE] as string) ?? ""}
                            placeholder={`请输入${activePlatformLabel}标题`}
                            maxLength={titleMaxLength}
                            showCount={Boolean(titleMaxLength)}
                            onChange={(event) =>
                              handleFieldChange(FIELD_ID_TITLE, event.target.value)
                            }
                            onBlur={() => handleFieldBlur(FIELD_ID_TITLE)}
                          />
                          {activeFormTouched[FIELD_ID_TITLE] &&
                          activeFormErrors[FIELD_ID_TITLE] ? (
                            <p className="pointer-events-none absolute left-0 top-full mt-1 text-xs text-red-500">
                              {activeFormErrors[FIELD_ID_TITLE]}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-7">
                        {orderedPlatformOptions.map((item) => {
                          const inlineField = isInlinePlatformField(
                            activePublishPlatform,
                            item.key,
                          );

                          return (
                            <div
                              key={item.key}
                              className={cn(
                                "flex gap-4",
                                inlineField ? "items-center" : "items-start",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-[7.5rem] shrink-0 text-sm text-foreground",
                                  inlineField ? "pt-0" : "pt-2",
                                )}
                              >
                                {getPublishFieldLabelByPlatform(
                                  activePublishPlatform,
                                  item.key,
                                )}
                                {getRequiredFields(activePublishPlatform).includes(
                                  item.key,
                                ) ? (
                                  <span className="ml-0.5 text-red-500">*</span>
                                ) : null}
                              </div>
                              <div className="relative min-w-0 flex-1">
                                {renderPlatformField(item.key)}
                                {activeFormTouched[item.key] &&
                                activeFormErrors[item.key] ? (
                                  <p className="pointer-events-none absolute left-0 top-full mt-1 text-xs text-red-500">
                                    {activeFormErrors[item.key]}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <PlatformPickerDialog
                open={addPlatformOpen}
                onOpenChange={setAddPlatformOpen}
                platforms={pickerPlatforms}
                disabledPlatformIds={Array.from(visiblePublishPlatformIdSet)}
                closeLabel={addPlatformDialogCopy.closeLabel}
                title={addPlatformDialogCopy.title}
                description={addPlatformDialogCopy.description}
                onSelectPlatform={(platformId) => {
                  if (!publishPlatformMap[platformId]) {
                    const template = publishPlatformEntries[0]?.[1] ?? null;
                    const platformAccounts = (allAccountsRes?.items ?? [])
                      .filter(
                        (account) =>
                          account.platform === toAccountPlatform(platformId),
                      )
                      .map(
                        (account): PublishEditAccount => ({
                          id: account.id,
                          avatar: account.avatar,
                          nickname: account.nickname,
                          account: account.account,
                          platform: account.platform,
                        }),
                      );
                    const nextPlatformData: PublishEditPlatform = {
                      accounts: platformAccounts,
                      content: template?.content ?? "",
                      draft: template?.draft ?? false,
                      skip_image_upload: template?.skip_image_upload ?? false,
                      timeout: template?.timeout ?? 60,
                      platform_options: getDefaultPlatformOptions(platformId),
                    };
                    setAddedPlatformDataById((previous) => ({
                      ...previous,
                      [platformId]: nextPlatformData,
                    }));
                  }

                  setDismissedPublishPlatforms((previous) => {
                    const next = new Set(previous);
                    next.delete(platformId);
                    return next;
                  });
                  setActivePublishPlatform(platformId);
                }}
              />
            </div>
          </aside>

          <ImagePickerSheet
            open={coverDrawerOpen}
            onOpenChange={(open) => {
              setCoverDrawerOpen(open);
              if (!open) {
                setCoverReplaceIndex(null);
                resetCoverDrawerSelection();
              }
            }}
            tab={coverDrawerTab}
            onTabChange={(tab) =>
              setCoverDrawerTab(
                tab as
                  | typeof COVER_PICKER_TAB_UPLOAD
                  | typeof COVER_PICKER_TAB_LIBRARY
                  | typeof COVER_PICKER_TAB_PROJECT
                  | typeof COVER_PICKER_TAB_SEARCH,
              )
            }
            uploadSlot={
              <>
                <input
                  ref={coverUploadInputRef}
                  type="file"
                  accept="image/*"
                  multiple={coverReplaceIndex == null}
                  className="hidden"
                  onChange={(event) => {
                    void onPickLocalUploadFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <input
                  ref={coverReuploadInputRef}
                  type="file"
                  accept="image/*"
                  multiple={false}
                  className="hidden"
                  onChange={(event) => {
                    void onPickLocalUploadFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </>
            }
            uploadCandidates={coverUploadCandidates}
            isUploading={coverUploading}
            onClickUpload={() => coverUploadInputRef.current?.click()}
            onClickUploadCandidate={(index) => {
              setCoverReuploadTargetIndex(index);
              coverReuploadInputRef.current?.click();
            }}
            showUploadContinue={
              coverReplaceIndex == null &&
              coverUploadCandidates.length < coverSelectableCount
            }
            onClickUploadContinue={() => coverUploadInputRef.current?.click()}
            uploadTabLabel={td("tabUpload", "上传图片")}
            libraryTabLabel={td("tabLibrary", "我的素材")}
            uploadLocalLabel={td("uploadLocal", "本地上传")}
            uploadingLabel={td("uploading", "上传中...")}
            reuploadLabel={td("reupload", "重新上传")}
            uploadContinueLabel={td("uploadContinue", "继续上传")}
            libraryLoadingLabel={td("libraryLoading", "素材加载中...")}
            emptyTitle={td("emptyTitle", "暂无图片素材")}
            emptyDescription={td(
              "emptyDescription",
              "请先上传图片素材，或切换到“上传图片”添加。",
            )}
            libraryItems={coverLibraryItems}
            selectedLibraryUrls={coverLibraryCandidates}
            isFetchingLibrary={isFetchingCoverLibrary}
            isLibraryItemDisabled={(url) =>
              !coverLibraryCandidates.includes(url) &&
              coverReplaceIndex == null &&
              coverLibraryCandidates.length >= coverSelectableCount
            }
            onToggleLibraryItem={toggleCoverLibraryCandidate}
            extraLibraryTabs={[
              {
                key: COVER_PICKER_TAB_PROJECT,
                label: td("tabProject", "项目图片"),
                items: coverProjectItems,
                selectedUrls: coverProjectCandidates,
                onToggleItem: toggleCoverProjectCandidate,
                isFetching: isFetchingCoverProject,
                isItemDisabled: (url) =>
                  !coverProjectCandidates.includes(url) &&
                  coverReplaceIndex == null &&
                  coverProjectCandidates.length >= coverSelectableCount,
                loadingLabel: td("libraryLoading", "素材加载中..."),
                emptyTitle: td("emptyTitle", "暂无图片素材"),
                emptyDescription: td(
                  "emptyDescription",
                  "请先上传图片素材，或切换到“上传图片”添加。",
                ),
              },
              {
                key: COVER_PICKER_TAB_SEARCH,
                label: td("tabSearch", "图片搜索"),
                items: coverSearchItems,
                selectedUrls: coverSearchCandidates,
                onToggleItem: toggleCoverSearchCandidate,
                isFetching: isFetchingCoverSearch,
                isItemDisabled: (url) =>
                  !coverSearchCandidates.includes(url) &&
                  coverReplaceIndex == null &&
                  coverSearchCandidates.length >= coverSelectableCount,
                loadingLabel: td("libraryLoading", "素材加载中..."),
                emptyTitle: td("emptyTitle", "暂无图片素材"),
                emptyDescription:
                  coverSearchCommittedQuery.trim().length > 0
                    ? td(
                        "emptyDescription",
                        "请先上传图片素材，或切换到“上传图片”添加。",
                      )
                    : td(
                        "searchEmptyDescription",
                        "请输入可用于图片搜索的标题关键词。",
                      ),
              },
            ]}
            libraryToolbar={(tabKey) =>
              tabKey === COVER_PICKER_TAB_SEARCH ? (
                <div className="mb-4 flex items-center gap-3 pl-1 pr-8 pt-1">
                  <Input
                    value={coverSearchInputValue}
                    onChange={(event) => setCoverSearchInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        triggerCoverImageSearch();
                      }
                    }}
                    placeholder={td("searchInputPlaceholder", "输入关键词搜索图片")}
                    className="h-10 w-[380px] max-w-full focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="button"
                    className="h-10 min-w-[84px] shrink-0 px-5"
                    onClick={triggerCoverImageSearch}
                  >
                    {td("searchButton", "搜索")}
                  </Button>
                </div>
              ) : null
            }
            maxSelectHint={`${td("maxSelect", `最多可选 ${coverSelectableCount} 张`, {
              count: coverSelectableCount,
            })}${
              coverReplaceIndex != null
                ? td("replaceModeSingleHint", "（替换模式仅支持单选）")
                : ""
            }`}
            cancelLabel={td("cancel", "取消")}
            confirmLabel={
              coverReplaceIndex != null
                ? td("replaceCover", "替换封面")
                : td("confirm", "确认")
            }
            confirmDisabled={
              coverDrawerTab === COVER_PICKER_TAB_UPLOAD
                ? coverUploadCandidates.length === 0
                : coverDrawerTab === COVER_PICKER_TAB_LIBRARY
                  ? coverLibraryCandidates.length === 0
                  : coverDrawerTab === COVER_PICKER_TAB_PROJECT
                    ? coverProjectCandidates.length === 0
                    : coverSearchCandidates.length === 0
            }
            onConfirm={() =>
              applyCoverSelection(
                coverDrawerTab === COVER_PICKER_TAB_UPLOAD
                  ? coverUploadCandidates
                  : coverDrawerTab === COVER_PICKER_TAB_LIBRARY
                    ? coverLibraryCandidates
                    : coverDrawerTab === COVER_PICKER_TAB_PROJECT
                      ? coverProjectCandidates
                      : coverSearchCandidates,
              )
            }
          />
        </div>
      ) : null}

      <Dialog
        open={publishResultSummary !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPublishResultSummary(null);
          }
        }}
      >
        <DialogContent
          className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden sm:max-w-lg"
          closeLabel="关闭"
        >
          {publishResultSummary ? (
            <>
              <DialogHeader className="shrink-0">
                <DialogTitle>发布结果</DialogTitle>
              </DialogHeader>
              <p className="shrink-0 text-sm text-muted-foreground">
                成功 {publishResultSummary.success}，失败 {publishResultSummary.failed}
                {publishResultSummary.total > 0
                  ? `（共 ${publishResultSummary.total} 个账号）`
                  : ""}
              </p>
              <div className="mt-4 min-h-0 max-h-[min(52vh,28rem)] flex-1 overflow-y-auto overscroll-y-contain pr-1">
                <ul className="space-y-2">
                  {publishFailedDetails.map((detail, index) => (
                    <li
                      key={`${detail.account_id}-${index}`}
                      className="rounded-lg border border-destructive/35 bg-destructive/5 px-3 py-2.5 text-sm"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {detail.account_name || detail.account_id}
                        </span>
                        {detail.account_platform ? (
                          <span className="text-xs text-muted-foreground">
                            {getPublishResultPlatformLabel(
                              detail.account_platform,
                            )}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-destructive">
                        发布失败
                      </div>
                      {detail.failure_reason ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {detail.failure_reason}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {publishFailedDetails.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {publishResultSummary.failed === 0
                      ? "全部账号发布成功"
                      : "暂无失败明细"}
                  </p>
                ) : null}
              </div>
              <DialogFooter className="mt-4 shrink-0 border-t border-border pt-4 sm:justify-end">
                <Button
                  type="button"
                  onClick={() => setPublishResultSummary(null)}
                >
                  知道了
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
