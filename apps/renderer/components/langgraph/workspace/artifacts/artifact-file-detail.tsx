import {
  CopyIcon,
  DownloadIcon,
  LoaderIcon,
  PackageIcon,
  Redo2Icon,
  Undo2Icon,
  XIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { marked } from "marked";
import { Placeholder } from "@tiptap/extension-placeholder";
import { isHistoryTransaction } from "@tiptap/pm/history";

import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/langgraph/ai-elements/artifact";
import { Button, buttonVariants } from "@/components/ui/button";
import { useArtifactContent } from "@/lib/langgraph/core/artifacts/hooks";
import { urlOfArtifact } from "@/lib/langgraph/core/artifacts/utils";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { installSkill } from "@/lib/langgraph/core/skills/api";
import type { AgentThreadContext } from "@/lib/langgraph/core/threads";
import { getFileName } from "@/lib/langgraph/core/utils/files";
import { env } from "@/lib/langgraph/env";
import { getApiErrorMessage } from "@/lib/request";
import { cn } from "@/lib/utils";
import { buildPublishEditPayload } from "@/lib/api/publish";
import type { PublishEditResponse } from "@/lib/api/publish";
import { useArtifacts } from "./context";
import { useThread } from "../messages/context";
import { createArtifactTurndownService } from "./artifact-editor-turndown";
import { artifactEditorContentClassName } from "./artifact-editor-prosemirror-classes";
import { ArtifactEditorBubbleToolbar } from "./artifact-editor-bubble-toolbar";
import { ArtifactLinkHoverPopover } from "./artifact-link-hover-popover";
import { HighlightWithSelectionMix } from "./artifact-highlight-extension";
import { normalizeAndValidateUrl } from "./artifact-url-utils";
import { useArtifactLinkHover } from "./use-artifact-link-hover";
import {
  BlockIndent,
  getSelectionIndentBounds,
} from "./block-indent-extension";
import {
  MandatoryTitleExtension,
  ensureMandatoryTitleMarkdown,
  isSelectionInMandatoryTitle,
  mandatoryTitlePlaceholderForNode,
} from "./mandatory-title-extension";
import { PublishAccountsDrawer } from "./publish-accounts-drawer";

const ARTIFACT_AUTOSAVE_MS = 2500;
/** 连续编辑结束后等待该时间，工具栏撤销才可用，并与 history 分组对齐 */
const UNDO_UI_DEBOUNCE_MS = 500;

type PublishEditCacheEntry = {
  publishEdit: PublishEditResponse;
  markdownSnapshot: string;
};

export function ArtifactFileDetail({
  className,
  filepath: filepathFromProps,
  threadId,
}: {
  className?: string;
  filepath: string;
  threadId: string;
}) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { thread } = useThread();
  const { context: localContext } = useLocalSettings()[0];
  const { setOpen, openPublishPreview } = useArtifacts();
  const isWriteFile = useMemo(() => {
    return filepathFromProps.startsWith("write-file:");
  }, [filepathFromProps]);
  const filepath = useMemo(() => {
    if (isWriteFile) {
      const url = new URL(filepathFromProps);
      return decodeURIComponent(url.pathname);
    }
    return filepathFromProps;
  }, [filepathFromProps, isWriteFile]);
  const { content } = useArtifactContent({
    threadId,
    filepath: filepathFromProps,
    enabled: !isWriteFile,
  });

  const displayContent = content ?? "";
  const artifactFileName = useMemo(() => getFileName(filepath), [filepath]);
  const isPersonaMarkdown = useMemo(() => {
    const lower = artifactFileName.toLowerCase();
    return lower.endsWith(".md") && lower.startsWith("persona");
  }, [artifactFileName]);

  const [isInstalling, setIsInstalling] = useState(false);
  const isSavingRef = useRef(false);
  const [openColorPanel, setOpenColorPanel] = useState<
    "text" | "highlight" | null
  >(null);
  const [openAlignPanel, setOpenAlignPanel] = useState(false);
  const [openBlockTypePanel, setOpenBlockTypePanel] = useState(false);
  const [openLinkPanel, setOpenLinkPanel] = useState(false);
  const [publishAccountsOpen, setPublishAccountsOpen] = useState(false);
  const [publishAccountIdsByArtifact, setPublishAccountIdsByArtifact] = useState<
    Record<string, string[]>
  >({});
  const [publishEditCacheBySelection, setPublishEditCacheBySelection] = useState<
    Record<string, PublishEditCacheEntry>
  >({});
  const publishAccountCacheKey = `${threadId}\u001f${filepathFromProps}`;
  const selectedPublishAccountIds =
    publishAccountIdsByArtifact[publishAccountCacheKey] ?? [];
  const buildPublishEditCacheKey = useCallback(
    (accountIds: string[]) => {
      const normalizedIds = [...accountIds].sort().join(",");
      return `${threadId}\u001f${filepathFromProps}\u001f${normalizedIds}`;
    },
    [filepathFromProps, threadId],
  );
  const [isPreparingPublishPreview, setIsPreparingPublishPreview] =
    useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState("");
  const [userHasEdited, setUserHasEdited] = useState(false);
  /** 用户编辑后须空闲 UNDO_UI_DEBOUNCE_MS，撤销按钮才可用（撤销/重做本身不计入） */
  const [undoIdleReady, setUndoIdleReady] = useState(true);
  const [editorMarkdown, setEditorMarkdown] = useState(() =>
    ensureMandatoryTitleMarkdown(displayContent),
  );
  const turndownRef = useRef(createArtifactTurndownService());
  const editorMarkdownRef = useRef(editorMarkdown);
  const displayContentRef = useRef(displayContent);
  const undoIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    editorMarkdownRef.current = editorMarkdown;
  }, [editorMarkdown]);
  useEffect(() => {
    displayContentRef.current = displayContent;
  }, [displayContent]);

  useEffect(() => {
    setEditorMarkdown(ensureMandatoryTitleMarkdown(displayContent));
  }, [displayContent]);

  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        undoRedo: { newGroupDelay: UNDO_UI_DEBOUNCE_MS },
      }),
      MandatoryTitleExtension,
      Placeholder.configure({
        showOnlyCurrent: false,
        placeholder: ({ editor, node }) =>
          mandatoryTitlePlaceholderForNode(editor, node),
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      BlockIndent,
      TextStyle,
      Color,
      HighlightWithSelectionMix.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    [],
  );

  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: "",
      editable: !isWriteFile,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          spellcheck: "false",
          autocorrect: "off",
          autocapitalize: "off",
          "data-gramm": "false",
        },
      },
      onUpdate({ editor, transaction }) {
        const markdown = turndownRef.current.turndown(editor.getHTML());
        setEditorMarkdown(ensureMandatoryTitleMarkdown(markdown));

        if (!transaction.docChanged) {
          return;
        }
        if (isHistoryTransaction(transaction)) {
          return;
        }

        setUserHasEdited(true);
        setUndoIdleReady(false);
        if (undoIdleTimerRef.current) {
          clearTimeout(undoIdleTimerRef.current);
        }
        undoIdleTimerRef.current = setTimeout(() => {
          undoIdleTimerRef.current = null;
          setUndoIdleReady(true);
        }, UNDO_UI_DEBOUNCE_MS);
      },
    },
    [],
  );

  const linkHover = useArtifactLinkHover(editor);

  const hideLinkHoverCard = linkHover.hideLinkHoverCard;

  const selectionState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) {
        return { empty: true, inMandatoryTitle: false };
      }
      return {
        empty: currentEditor.state.selection.empty,
        inMandatoryTitle: isSelectionInMandatoryTitle(currentEditor),
      };
    },
  });

  const closeAllFloatingPanels = useCallback(() => {
    setOpenColorPanel(null);
    setOpenAlignPanel(false);
    setOpenBlockTypePanel(false);
    setOpenLinkPanel(false);
    hideLinkHoverCard();
  }, [hideLinkHoverCard]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isWriteFile);
  }, [editor, isWriteFile]);

  useEffect(() => {
    setUserHasEdited(false);
    setUndoIdleReady(true);
    if (undoIdleTimerRef.current) {
      clearTimeout(undoIdleTimerRef.current);
      undoIdleTimerRef.current = null;
    }
  }, [filepathFromProps, threadId]);

  useEffect(() => {
    return () => {
      if (undoIdleTimerRef.current) {
        clearTimeout(undoIdleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    const closeFloatingPanelsIfSelectionEmpty = () => {
      if (editor.state.selection.empty) {
        closeAllFloatingPanels();
      }
    };
    editor.on("blur", closeFloatingPanelsIfSelectionEmpty);
    return () => {
      editor.off("blur", closeFloatingPanelsIfSelectionEmpty);
    };
  }, [editor, closeAllFloatingPanels]);

  useEffect(() => {
    if (!selectionState) return;
    const hasOpenFloatingPanel =
      openColorPanel !== null ||
      openAlignPanel ||
      openBlockTypePanel ||
      openLinkPanel ||
      linkHover.linkHoverOpen;
    if (!hasOpenFloatingPanel) return;
    if (selectionState.empty || selectionState.inMandatoryTitle) {
      closeAllFloatingPanels();
    }
  }, [
    selectionState,
    openColorPanel,
    openAlignPanel,
    openBlockTypePanel,
    openLinkPanel,
    linkHover.linkHoverOpen,
    closeAllFloatingPanels,
  ]);

  useEffect(() => {
    if (!editor) return;
    const hydrate = async () => {
      const normalizedMd = ensureMandatoryTitleMarkdown(displayContent ?? "");
      try {
        const fromEditorRaw = turndownRef.current.turndown(editor.getHTML());
        const normalizedFromEditor = ensureMandatoryTitleMarkdown(fromEditorRaw);
        // 须与 normalizedMd 同一套规则比较：否则空标题等场景 turndown 不等价于已保存 md，会误触发 setContent 丢焦点
        if (normalizedFromEditor.trim() === normalizedMd.trim()) {
          return;
        }
      } catch {
        /* compare failed — fall through to setContent */
      }
      const html = await marked.parse(normalizedMd);
      editor
        .chain()
        .setMeta("addToHistory", false)
        .setContent(typeof html === "string" ? html : "", {
          emitUpdate: false,
        })
        .run();
      setEditorMarkdown(normalizedMd);
      editorMarkdownRef.current = normalizedMd;
    };
    void hydrate();
  }, [editor, displayContent]);

  const canPersist = !isWriteFile && !!threadId;
  const currentTextColor =
    (editor?.getAttributes("textStyle").color as string | undefined) ??
    "#111827";
  const currentHighlightColor =
    (editor?.getAttributes("highlight").color as string | undefined) ??
    "#fecaca";
  const currentTextAlign = editor?.isActive({ textAlign: "center" })
    ? "center"
    : editor?.isActive({ textAlign: "right" })
      ? "right"
      : editor?.isActive({ textAlign: "justify" })
        ? "justify"
        : "left";
  const indentBounds = editor
    ? getSelectionIndentBounds(editor)
    : { canIncrease: false, canDecrease: false };

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkInputValue.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const validatedUrl = normalizeAndValidateUrl(url);
      if (!validatedUrl) {
        toast.error("请输入有效的网址");
        return;
      }
      editor.chain().focus().setLink({ href: validatedUrl }).run();
    }
    closeAllFloatingPanels();
  }, [editor, linkInputValue, closeAllFloatingPanels]);

  const persistArtifact = useCallback(async () => {
    if (!canPersist) return;
    if (isSavingRef.current) {
      window.setTimeout(() => {
        void persistArtifact();
      }, 400);
      return;
    }
    const contentToSave = editorMarkdownRef.current;
    if (contentToSave === displayContentRef.current) return;

    isSavingRef.current = true;
    try {
      const response = await fetch(urlOfArtifact({ filepath, threadId }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSave }),
      });
      if (!response.ok) {
        throw new Error(`Failed to save document: ${response.status}`);
      }
      if (editorMarkdownRef.current === contentToSave) {
        queryClient.setQueryData(
          ["artifact", filepathFromProps, threadId],
          contentToSave,
        );
      }
    } catch (error) {
      console.error("Failed to save markdown artifact:", error);
      toast.error("Failed to save document");
    } finally {
      isSavingRef.current = false;
    }
  }, [canPersist, filepathFromProps, filepath, queryClient, threadId]);

  useEffect(() => {
    if (!canPersist) return;
    if (editorMarkdown === displayContent) return;

    const id = setTimeout(() => {
      void persistArtifact();
    }, ARTIFACT_AUTOSAVE_MS);
    return () => clearTimeout(id);
  }, [canPersist, displayContent, editorMarkdown, persistArtifact]);

  const handleInstallSkill = useCallback(async () => {
    if (isInstalling) return;

    setIsInstalling(true);
    try {
      const result = await installSkill({
        thread_id: threadId,
        path: filepath,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message ?? "Failed to install skill");
      }
    } catch (error) {
      console.error("Failed to install skill:", error);
      toast.error("Failed to install skill");
    } finally {
      setIsInstalling(false);
    }
  }, [threadId, filepath, isInstalling]);

  const openPublishPreviewForAccounts = useCallback(
    async (accountIds: string[]) => {
      if (accountIds.length === 0) return;
      if (isPreparingPublishPreview) return;
      const cacheKey = buildPublishEditCacheKey(accountIds);
      const markdownSnapshot = editorMarkdownRef.current;
      const cachedEntry = publishEditCacheBySelection[cacheKey];
      if (cachedEntry && cachedEntry.markdownSnapshot === markdownSnapshot) {
        openPublishPreview({
          title: getFileName(filepath),
          contentHtml: editor?.getHTML() ?? "",
          selectedAccountIds: accountIds,
          publishEdit: cachedEntry.publishEdit,
        });
        return;
      }
      setIsPreparingPublishPreview(true);
      try {
        const publishEdit = await buildPublishEditPayload({
          threadId,
          artifacts: filepathFromProps,
          accountIds,
        });
        setPublishEditCacheBySelection((prev) => ({
          ...prev,
          [cacheKey]: {
            publishEdit,
            markdownSnapshot,
          },
        }));
        openPublishPreview({
          title: getFileName(filepath),
          contentHtml: editor?.getHTML() ?? "",
          selectedAccountIds: accountIds,
          publishEdit,
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "加载发布配置失败"));
      } finally {
        setIsPreparingPublishPreview(false);
      }
    },
    [
      editor,
      filepath,
      filepathFromProps,
      buildPublishEditCacheKey,
      isPreparingPublishPreview,
      openPublishPreview,
      publishEditCacheBySelection,
      threadId,
    ],
  );

  const buildAgentContext = useCallback((): AgentThreadContext => {
    return {
      ...localContext,
      thinking_enabled: localContext.mode !== "flash",
      is_plan_mode: localContext.mode === "pro" || localContext.mode === "ultra",
      subagent_enabled: localContext.mode === "ultra",
      reasoning_effort:
        localContext.reasoning_effort ??
        (localContext.mode === "ultra"
          ? "high"
          : localContext.mode === "pro"
            ? "medium"
            : localContext.mode === "thinking"
              ? "low"
              : undefined),
      thread_id: threadId,
    } as unknown as AgentThreadContext;
  }, [localContext, threadId]);

  const handlePersonaSave = useCallback(async () => {
    if (isSavingPersona) return;
    setIsSavingPersona(true);
    try {
      await thread.submit(
        {
          messages: [
            {
              type: "human",
              content: [{ type: "text", text: "保存人设" }],
            },
          ],
        },
        {
          threadId,
          streamSubgraphs: true,
          streamResumable: true,
          config: { recursion_limit: 1000 },
          context: buildAgentContext(),
        },
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "保存人设失败"));
    } finally {
      setIsSavingPersona(false);
    }
  }, [buildAgentContext, isSavingPersona, thread, threadId]);

  return (
    <>
      <Artifact className={cn(className)}>
      <ArtifactHeader className="bg-background px-4">
        <div className="flex min-w-0 items-center">
          {isWriteFile && (
            <ArtifactTitle className="min-w-0">
              <div className="truncate">{artifactFileName}</div>
            </ArtifactTitle>
          )}
        </div>
        <div className="min-w-0 grow" />
        <div className="flex items-center gap-2">
          <ArtifactActions className="gap-3">
            {!isWriteFile && filepath.endsWith(".skill") && (
              <ArtifactAction
                icon={isInstalling ? LoaderIcon : PackageIcon}
                label={t.common.install}
                tooltip={t.toolCalls.skillInstallTooltip}
                disabled={
                  isInstalling || env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true"
                }
                onClick={handleInstallSkill}
              />
            )}
            {!isWriteFile && (
              <>
                <ArtifactAction
                  icon={Undo2Icon}
                  label={t.common.undo}
                  tooltip={t.common.undo}
                  disabled={
                    !editor ||
                    !userHasEdited ||
                    !undoIdleReady ||
                    !editor.can().undo()
                  }
                  onClick={() => {
                    editor?.chain().focus().undo().run();
                  }}
                />
                <ArtifactAction
                  icon={Redo2Icon}
                  label={t.common.redo}
                  tooltip={t.common.redo}
                  disabled={!editor || !editor.can().redo()}
                  onClick={() => {
                    editor?.chain().focus().redo().run();
                  }}
                />
              </>
            )}
            <ArtifactAction
              icon={CopyIcon}
              textLabel="复制"
              label={t.clipboard.copyToClipboard}
              disabled={!content}
              onClick={async () => {
                try {
                  const text = displayContent ?? "";
                  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                  } else {
                    // Fallback for browsers (e.g. Safari) where `navigator.clipboard` is unavailable.
                    const textarea = document.createElement("textarea");
                    textarea.value = text;
                    textarea.setAttribute("readonly", "true");
                    textarea.style.position = "fixed";
                    textarea.style.left = "-9999px";
                    document.body.appendChild(textarea);
                    textarea.select();
                    const ok = document.execCommand("copy");
                    document.body.removeChild(textarea);
                    if (!ok) throw new Error("execCommand copy failed");
                  }
                  toast.success(t.clipboard.copiedToClipboard);
                } catch (error) {
                  toast.error("Failed to copy to clipboard");
                  console.error(error);
                }
              }}
            />
            {!isWriteFile && (
              <a
                href={urlOfArtifact({ filepath, threadId, download: true })}
                target="_blank"
                rel="noopener noreferrer"
                title={t.common.download}
                aria-label={t.common.download}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-lg px-2",
                )}
              >
                <DownloadIcon className="size-4 shrink-0" />
                <span className="text-sm font-normal">下载</span>
              </a>
            )}
            {!isWriteFile && (
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 gap-1.5 px-4 text-sm font-semibold shadow-sm"
                disabled={
                  env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true" ||
                  isPreparingPublishPreview ||
                  isSavingPersona
                }
                onClick={() => {
                  if (isPersonaMarkdown) {
                    void handlePersonaSave();
                    return;
                  }
                  if (selectedPublishAccountIds.length > 0) {
                    void openPublishPreviewForAccounts(selectedPublishAccountIds);
                    return;
                  }
                  setPublishAccountsOpen(true);
                }}
              >
                {isPersonaMarkdown ? t.common.savePersona : t.common.publish}
              </Button>
            )}
            <ArtifactAction
              icon={XIcon}
              label={t.common.close}
              onClick={() => setOpen(false)}
              tooltip={t.common.close}
            />
          </ArtifactActions>
        </div>
      </ArtifactHeader>
      <ArtifactContent className="p-0">
        {editor && (
          <div className="overflow-auto px-16 py-8">
            <ArtifactLinkHoverPopover linkHover={linkHover} />
            <ArtifactEditorBubbleToolbar
              editor={editor}
              disabled={isPersonaMarkdown}
              closeAllFloatingPanels={closeAllFloatingPanels}
              openBlockTypePanel={openBlockTypePanel}
              setOpenBlockTypePanel={setOpenBlockTypePanel}
              openAlignPanel={openAlignPanel}
              setOpenAlignPanel={setOpenAlignPanel}
              openColorPanel={openColorPanel}
              setOpenColorPanel={setOpenColorPanel}
              openLinkPanel={openLinkPanel}
              setOpenLinkPanel={setOpenLinkPanel}
              linkInputValue={linkInputValue}
              setLinkInputValue={setLinkInputValue}
              applyLink={applyLink}
              currentTextColor={currentTextColor}
              currentHighlightColor={currentHighlightColor}
              currentTextAlign={currentTextAlign}
              indentBounds={indentBounds}
            />
            <EditorContent
              className={artifactEditorContentClassName}
              editor={editor}
            />
          </div>
        )}
      </ArtifactContent>
      </Artifact>
      <PublishAccountsDrawer
        open={publishAccountsOpen}
        onOpenChange={setPublishAccountsOpen}
        onConfirm={(ids) => {
          setPublishAccountIdsByArtifact((prev) => ({
            ...prev,
            [publishAccountCacheKey]: ids,
          }));
          void openPublishPreviewForAccounts(ids);
        }}
      />
    </>
  );
}

