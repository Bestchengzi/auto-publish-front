import {
  CopyIcon,
  DownloadIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ImageIcon,
  Loader2Icon,
  Redo2Icon,
  TypeIcon,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
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
import { ImagePickerSheet } from "@/components/common/image-picker-sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as mediaApi from "@/lib/api/media";
import { getBackendBaseURL } from "@/lib/langgraph/core/config";
import { useArtifactContent } from "@/lib/langgraph/core/artifacts/hooks";
import { urlOfArtifact } from "@/lib/langgraph/core/artifacts/utils";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import type { AgentThreadContext } from "@/lib/langgraph/core/threads";
import { getUploadPreviewUrl, uploadFiles } from "@/lib/langgraph/core/uploads/api";
import { getFileName } from "@/lib/langgraph/core/utils/files";
import { artifactCodeLowlight } from "@/lib/langgraph/workspace/artifacts/artifact-code-lowlight";
import { getApiErrorMessage, request } from "@/lib/request";
import { cn } from "@/lib/utils";
import { usePublishFlow } from "@/components/publish";
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

const ARTIFACT_AUTOSAVE_MS = 2500;
/** 连续编辑结束后等待该时间，工具栏撤销才可用，并与 history 分组对齐 */
const UNDO_UI_DEBOUNCE_MS = 500;
/** 抽屉关闭动画结束后再打开发布面板，避免视觉跳变 */
const IMAGE_PICKER_TAB_UPLOAD = "upload";
const IMAGE_PICKER_TAB_LIBRARY = "library";
const IMAGE_PICKER_TAB_PROJECT = "project";
const IMAGE_PICKER_TAB_SEARCH = "search";

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

const ImageWithDeleteKeepsLine = Image.extend({
  addKeyboardShortcuts() {
    const replaceImageWithEmptyParagraph = () => {
      const { state, view } = this.editor;
      const { selection } = state;
      if (!(selection instanceof NodeSelection)) return false;
      if (selection.node.type.name !== this.name) return false;
      const { from, to } = selection;
      const parent = selection.$from.parent;
      const index = selection.$from.index();
      const prev = index > 0 ? parent.child(index - 1) : null;
      const next = index < parent.childCount - 1 ? parent.child(index + 1) : null;
      const isEmptyParagraph = (node: typeof prev) =>
        node?.type.name === "paragraph" && node.content.size === 0;

      const tr = state.tr.deleteRange(from, to);
      let targetPos: number;

      if (prev && isEmptyParagraph(prev)) {
        // 优先停在图片上方已存在的空行，避免额外新增空行
        const prevInnerPos = from - prev.nodeSize + 1;
        targetPos = tr.mapping.map(prevInnerPos);
      } else if (next && isEmptyParagraph(next)) {
        // 若下方已有空行，则复用该空行
        const nextInnerPos = to + 1;
        targetPos = tr.mapping.map(nextInnerPos);
      } else {
        const paragraphType = state.schema.nodes.paragraph;
        if (!paragraphType) return false;
        tr.insert(from, paragraphType.create());
        targetPos = from + 1;
      }

      const safePos = Math.min(Math.max(targetPos, 1), tr.doc.content.size);
      tr.setSelection(TextSelection.create(tr.doc, safePos)).scrollIntoView();
      view.dispatch(tr);
      return true;
    };

    return {
      Backspace: replaceImageWithEmptyParagraph,
      Delete: replaceImageWithEmptyParagraph,
    };
  },
});

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
  const { beginArtifactPublish, isPreparingPublishPreview } = usePublishFlow();
  const { context: localContext } = useLocalSettings()[0];
  const { setOpen, selectionVersion } = useArtifacts();
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
    refreshKey: selectionVersion,
    enabled: !isWriteFile,
  });

  const writeFilePreviewContent = useMemo(() => {
    if (!isWriteFile) {
      return "";
    }

    try {
      const url = new URL(filepathFromProps);
      const messageId = url.searchParams.get("message_id");
      const toolCallId = url.searchParams.get("tool_call_id");
      if (!messageId || !toolCallId) {
        return "";
      }

      const aiMessage = thread.messages.find(
        (m) => m.type === "ai" && String(m.id ?? "") === messageId,
      );
      const aiToolCalls = (aiMessage as { tool_calls?: unknown } | undefined)
        ?.tool_calls;
      if (!Array.isArray(aiToolCalls)) {
        return "";
      }

      const toolCall = aiToolCalls.find(
        (call: unknown) =>
          String((call as { id?: string } | undefined)?.id ?? "") === toolCallId,
      ) as
        | {
            name?: string;
            args?: unknown;
          }
        | undefined;
      if (!toolCall) {
        return "";
      }

      const args = (toolCall.args ?? {}) as Record<string, unknown>;
      if (toolCall.name === "str_replace") {
        return typeof args.new_str === "string" ? args.new_str : "";
      }

      if (toolCall.name === "write_file") {
        return typeof args.content === "string" ? args.content : "";
      }

      return "";
    } catch {
      return "";
    }
  }, [isWriteFile, filepathFromProps, thread.messages]);

  const displayContent = isWriteFile ? writeFilePreviewContent : (content ?? "");
  const artifactFileName = useMemo(() => getFileName(filepath), [filepath]);
  const isPersonaMarkdown = useMemo(() => {
    const lower = artifactFileName.toLowerCase();
    return lower.endsWith(".md") && lower.startsWith("persona");
  }, [artifactFileName]);

  const isSavingRef = useRef(false);
  const [openColorPanel, setOpenColorPanel] = useState<
    "text" | "highlight" | null
  >(null);
  const [openAlignPanel, setOpenAlignPanel] = useState(false);
  const [openBlockTypePanel, setOpenBlockTypePanel] = useState(false);
  const [openLinkPanel, setOpenLinkPanel] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerSession, setImagePickerSession] = useState(0);
  const [imagePickerTab, setImagePickerTab] = useState<
    | typeof IMAGE_PICKER_TAB_UPLOAD
    | typeof IMAGE_PICKER_TAB_LIBRARY
    | typeof IMAGE_PICKER_TAB_PROJECT
    | typeof IMAGE_PICKER_TAB_SEARCH
  >(IMAGE_PICKER_TAB_UPLOAD);
  const [imagePickerUploading, setImagePickerUploading] = useState(false);
  const [imageUploadCandidates, setImageUploadCandidates] = useState<string[]>([]);
  const [imageLibraryCandidates, setImageLibraryCandidates] = useState<string[]>(
    [],
  );
  const [imageProjectCandidates, setImageProjectCandidates] = useState<string[]>(
    [],
  );
  const [imageSearchCandidates, setImageSearchCandidates] = useState<string[]>(
    [],
  );
  const [imageSearchInputValue, setImageSearchInputValue] = useState("");
  const [imageSearchCommittedQuery, setImageSearchCommittedQuery] = useState("");
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
  const editorViewportRef = useRef<HTMLDivElement | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageInsertPosRef = useRef<number | null>(null);

  useEffect(() => {
    editorMarkdownRef.current = editorMarkdown;
  }, [editorMarkdown]);
  useEffect(() => {
    if (imagePickerOpen) {
      setImagePickerSession((v) => v + 1);
    }
  }, [imagePickerOpen]);
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
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight: artifactCodeLowlight,
        defaultLanguage: "plaintext",
      }),
      MandatoryTitleExtension,
      Placeholder.configure({
        showOnlyCurrent: false,
        placeholder: ({ editor, node, pos }) => {
          const titlePlaceholder = mandatoryTitlePlaceholderForNode(
            editor,
            node,
            t.slashMenu.titlePlaceholder,
          );
          if (titlePlaceholder) return titlePlaceholder;
          const { selection } = editor.state;
          if (!selection.empty) return "";
          const isSlashPlaceholderBlock =
            node.type.name === "paragraph" ||
            (node.type.name === "heading" &&
              [1, 2, 3, 4].includes(Number(node.attrs.level)));
          if (!isSlashPlaceholderBlock || node.content.size !== 0) return "";
          const currentNodePos = selection.$from.before(selection.$from.depth);
          if (currentNodePos !== pos) return "";
          if (selection.$from.parentOffset !== 0) return "";
          return t.slashMenu.placeholder;
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      BlockIndent,
      TextStyle,
      Color,
      HighlightWithSelectionMix.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Underline,
      ImageWithDeleteKeepsLine.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    [t.slashMenu.placeholder, t.slashMenu.titlePlaceholder],
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

        const { selection } = editor.state;
        const currentBlock = selection.$from.parent;
        const inMandatoryTitle = isSelectionInMandatoryTitle(editor);
        const inSlashTriggerBlock =
          currentBlock.type.name === "paragraph" ||
          (currentBlock.type.name === "heading" &&
            [1, 2, 3, 4].includes(Number(currentBlock.attrs.level)));
        const slashTriggerReady =
          selection.empty &&
          !inMandatoryTitle &&
          inSlashTriggerBlock &&
          currentBlock.textContent === "/" &&
          selection.$from.parentOffset === 1;
        if (slashTriggerReady) {
          const coords = editor.view.coordsAtPos(selection.from);
          const containerRect = editorViewportRef.current?.getBoundingClientRect();
          if (containerRect) {
            setSlashMenuPosition({
              top: coords.bottom - containerRect.top + 6,
              left: coords.left - containerRect.left,
            });
          }
          setSlashMenuOpen(true);
        } else {
          setSlashMenuOpen(false);
        }

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

  const removeSlashTrigger = useCallback(() => {
    if (!editor) return false;
    const { selection } = editor.state;
    if (!selection.empty) return false;
    if (isSelectionInMandatoryTitle(editor)) return false;
    const currentBlock = selection.$from.parent;
    const inSlashTriggerBlock =
      currentBlock.type.name === "paragraph" ||
      (currentBlock.type.name === "heading" &&
        [1, 2, 3, 4].includes(Number(currentBlock.attrs.level)));
    if (!inSlashTriggerBlock || currentBlock.textContent !== "/") {
      return false;
    }
    const start = selection.$from.start();
    const tr = editor.state.tr.delete(start, start + 1);
    tr.setSelection(TextSelection.create(tr.doc, start));
    editor.view.dispatch(tr);
    return true;
  }, [editor]);

  const applySlashCommand = useCallback(
    async (command: "image" | "paragraph" | "h1" | "h2" | "h3" | "h4") => {
      if (!editor) return;
      removeSlashTrigger();
      setSlashMenuOpen(false);
      if (command === "image") {
        pendingImageInsertPosRef.current = editor.state.selection.from;
        setImagePickerTab(IMAGE_PICKER_TAB_UPLOAD);
        setImageUploadCandidates([]);
        setImageLibraryCandidates([]);
        setImageProjectCandidates([]);
        setImageSearchCandidates([]);
        setImageSearchInputValue("");
        setImageSearchCommittedQuery("");
        setImagePickerOpen(true);
        return;
      }
      if (command === "paragraph") {
        editor.chain().focus().setParagraph().run();
        return;
      }
      const headingLevelByCommand = {
        h1: 1,
        h2: 2,
        h3: 3,
        h4: 4,
      } as const;
      editor
        .chain()
        .focus()
        .setNode("heading", { level: headingLevelByCommand[command] })
        .run();
    },
    [editor, removeSlashTrigger],
  );

  const insertSelectedImage = useCallback(
    (url: string) => {
      if (!editor || !url) return;
      const docLimit = editor.state.doc.content.size;
      const targetPos = Math.min(
        Math.max(pendingImageInsertPosRef.current ?? editor.state.selection.from, 1),
        docLimit,
      );
      editor
        .chain()
        .focus()
        .setTextSelection(targetPos)
        .setImage({ src: url, alt: "image" })
        .run();
      pendingImageInsertPosRef.current = null;
      setImagePickerOpen(false);
    },
    [editor],
  );

  const onPickImageUploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !threadId) {
        if (!threadId) toast.error("当前会话不可用，无法上传图片");
        return;
      }
      const selected = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, 1);
      if (selected.length === 0) {
        toast.error("请选择图片文件");
        return;
      }
      setImagePickerUploading(true);
      try {
        const res = await uploadFiles(threadId, selected);
        const urls = (res.files ?? [])
          .map((f) => getUploadPreviewUrl(f))
          .filter((u): u is string => typeof u === "string" && u.length > 0);
        if (urls.length === 0) {
          toast.error("上传成功，但未获取到图片地址");
          return;
        }
        setImageUploadCandidates([urls[0]!]);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "上传失败"));
      } finally {
        setImagePickerUploading(false);
      }
    },
    [threadId],
  );

  const toggleImageLibraryCandidate = useCallback((url: string) => {
    setImageLibraryCandidates((prev) => {
      if (prev.includes(url)) return [];
      return [url];
    });
  }, []);
  const toggleImageProjectCandidate = useCallback((url: string) => {
    setImageProjectCandidates((prev) => {
      if (prev.includes(url)) return [];
      return [url];
    });
  }, []);
  const toggleImageSearchCandidate = useCallback((url: string) => {
    setImageSearchCandidates((prev) => {
      if (prev.includes(url)) return [];
      return [url];
    });
  }, []);

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
  const { data: imageLibraryItems = [], isFetching: isFetchingImageLibrary } =
    useQuery({
      queryKey: ["artifact-image-picker", "library-images", imagePickerSession],
      queryFn: async () => {
        const res = await mediaApi.listMedia({ media_type: "image" });
        return res.items.map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
        }));
      },
      enabled: imagePickerOpen,
    });
  const { data: projectImageItems = [], isFetching: isFetchingProjectImages } =
    useQuery({
      queryKey: [
        "artifact-image-picker",
        "project-images",
        threadId,
        imagePickerSession,
      ],
      queryFn: async () => {
        const response = await request<ArtifactListResponse>(
          `${getBackendBaseURL()}/api/threads/${threadId}/artifacts/list?file_type=image`,
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
      enabled: imagePickerOpen && !!threadId,
    });
  const { data: imageSearchItems = [], isFetching: isFetchingImageSearch } =
    useQuery({
      queryKey: [
        "artifact-image-picker",
        "image-search",
        imageSearchCommittedQuery,
        imagePickerSession,
      ],
      queryFn: async () => {
        const response = await request<ImageSearchResponse>(
          `${getBackendBaseURL()}/api/tools/image_search?query=${encodeURIComponent(
            imageSearchCommittedQuery,
          )}&max_results=40`,
        );
        return (response.results ?? [])
          .map((item, index) => {
            const thumbnail = (item.thumbnail_url ?? "").trim();
            const fallback = (item.image_url ?? "").trim();
            const url = thumbnail || fallback;
            if (!url) return null;
            return {
              id: `${index}-${url}`,
              name: item.title?.trim() || item.source_url?.trim() || `image-${index + 1}`,
              // image_search 场景按要求优先使用 thumbnail_url 展示
              url,
            };
          })
          .filter((item): item is { id: string; name: string; url: string } =>
            Boolean(item),
          );
      },
      enabled: imagePickerOpen && imageSearchCommittedQuery.trim().length > 0,
    });
  const triggerImageSearch = useCallback(() => {
    const next = imageSearchInputValue.trim();
    if (!next) {
      toast.error(t.coverDrawer.searchKeywordRequired);
      return;
    }
    setImageSearchCandidates([]);
    setImageSearchCommittedQuery(next);
  }, [imageSearchInputValue, t.coverDrawer.searchKeywordRequired]);

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
          ["artifact", filepathFromProps, threadId, selectionVersion],
          contentToSave,
        );
      }
    } catch (error) {
      console.error("Failed to save markdown artifact:", error);
      toast.error(t.common.saveFailed);
    } finally {
      isSavingRef.current = false;
    }
  }, [
    canPersist,
    filepathFromProps,
    filepath,
    queryClient,
    selectionVersion,
    threadId,
  ]);

  useEffect(() => {
    if (!canPersist) return;
    if (editorMarkdown === displayContent) return;

    const id = setTimeout(() => {
      void persistArtifact();
    }, ARTIFACT_AUTOSAVE_MS);
    return () => clearTimeout(id);
  }, [canPersist, displayContent, editorMarkdown, persistArtifact]);

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
      search_enabled: localContext.search_enabled ?? true,
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
      <Artifact className={cn("relative", className)}>
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
              textLabel={t.common.copy}
              label={t.clipboard.copyToClipboard}
              disabled={!displayContent}
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
                <span className="text-sm font-normal">{t.common.download}</span>
              </a>
            )}
            {!isWriteFile && (
              <Button
                type="button"
                size="lg"
                className="shrink-0"
                disabled={
                  isPreparingPublishPreview ||
                  isSavingPersona
                }
                onClick={() => {
                  if (isPersonaMarkdown) {
                    void handlePersonaSave();
                    return;
                  }
                  void beginArtifactPublish({
                    threadId,
                    artifactPath: filepathFromProps,
                    title: getFileName(filepath),
                    contentHtml: editor?.getHTML() ?? "",
                    markdownSnapshot: editorMarkdownRef.current,
                  });
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
          <div ref={editorViewportRef} className="relative overflow-auto px-16 py-8">
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
            {slashMenuOpen && (
              <div
                className="absolute z-50 min-w-[220px] rounded-lg border bg-background p-1 shadow-lg"
                style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
              >
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {t.slashMenu.sectionCommon}
                </div>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => void applySlashCommand("image")}
                >
                  <ImageIcon className="size-4" />
                  {t.slashMenu.image}
                </button>
                <div className="my-1 h-px bg-border" />
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {t.slashMenu.sectionBasic}
                </div>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => void applySlashCommand("paragraph")}
                >
                  <TypeIcon className="size-4" />
                  {t.slashMenu.paragraph}
                </button>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => void applySlashCommand("h1")}
                >
                  <Heading1Icon className="size-4" />
                  {t.slashMenu.heading1}
                </button>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => void applySlashCommand("h2")}
                >
                  <Heading2Icon className="size-4" />
                  {t.slashMenu.heading2}
                </button>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => void applySlashCommand("h3")}
                >
                  <Heading3Icon className="size-4" />
                  {t.slashMenu.heading3}
                </button>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => void applySlashCommand("h4")}
                >
                  <Heading4Icon className="size-4" />
                  {t.slashMenu.heading4}
                </button>
              </div>
            )}
          </div>
        )}
      </ArtifactContent>
      {isSavingPersona && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/65 backdrop-blur-[2px]"
        >
          <Loader2Icon className="size-10 shrink-0 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {t.common.saving}
          </span>
        </div>
      )}
      </Artifact>
      <ImagePickerSheet
        open={imagePickerOpen}
        onOpenChange={(open) => {
          setImagePickerOpen(open);
          if (!open) {
            setImagePickerTab(IMAGE_PICKER_TAB_UPLOAD);
            setImageUploadCandidates([]);
            setImageLibraryCandidates([]);
            setImageProjectCandidates([]);
            setImageSearchCandidates([]);
            setImageSearchInputValue("");
            setImageSearchCommittedQuery("");
            pendingImageInsertPosRef.current = null;
          }
        }}
        tab={imagePickerTab}
        onTabChange={(tab) =>
          setImagePickerTab(
            tab as
              | typeof IMAGE_PICKER_TAB_UPLOAD
              | typeof IMAGE_PICKER_TAB_LIBRARY
              | typeof IMAGE_PICKER_TAB_PROJECT
              | typeof IMAGE_PICKER_TAB_SEARCH,
          )
        }
        uploadSlot={
          <input
            ref={imageUploadInputRef}
            type="file"
            accept="image/*"
            multiple={false}
            className="hidden"
            onChange={(e) => {
              void onPickImageUploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        }
        uploadCandidates={imageUploadCandidates}
        isUploading={imagePickerUploading}
        onClickUpload={() => imageUploadInputRef.current?.click()}
        onClickUploadCandidate={() => imageUploadInputRef.current?.click()}
        uploadTabLabel={t.coverDrawer.tabUpload}
        libraryTabLabel={t.coverDrawer.tabLibrary}
        uploadLocalLabel={t.coverDrawer.uploadLocal}
        uploadingLabel={t.coverDrawer.uploading}
        reuploadLabel={t.coverDrawer.reupload}
        uploadContinueLabel={t.coverDrawer.uploadContinue}
        libraryLoadingLabel={t.coverDrawer.libraryLoading}
        emptyTitle={t.coverDrawer.emptyTitle}
        emptyDescription={t.coverDrawer.emptyDescription}
        libraryItems={imageLibraryItems}
        selectedLibraryUrls={imageLibraryCandidates}
        onToggleLibraryItem={toggleImageLibraryCandidate}
        isFetchingLibrary={isFetchingImageLibrary}
        extraLibraryTabs={[
          {
            key: IMAGE_PICKER_TAB_PROJECT,
            label: t.coverDrawer.tabProject,
            items: projectImageItems,
            selectedUrls: imageProjectCandidates,
            onToggleItem: toggleImageProjectCandidate,
            isFetching: isFetchingProjectImages,
            loadingLabel: t.coverDrawer.libraryLoading,
            emptyTitle: t.coverDrawer.emptyTitle,
            emptyDescription: t.coverDrawer.emptyDescription,
          },
          {
            key: IMAGE_PICKER_TAB_SEARCH,
            label: t.coverDrawer.tabSearch,
            items: imageSearchItems,
            selectedUrls: imageSearchCandidates,
            onToggleItem: toggleImageSearchCandidate,
            isFetching: isFetchingImageSearch,
            loadingLabel: t.coverDrawer.libraryLoading,
            emptyTitle: t.coverDrawer.emptyTitle,
            emptyDescription:
              imageSearchCommittedQuery.trim().length > 0
                ? t.coverDrawer.emptyDescription
                : t.coverDrawer.searchEmptyDescription,
          },
        ]}
        libraryToolbar={(tabKey) =>
          tabKey === IMAGE_PICKER_TAB_SEARCH ? (
            <div className="mb-4 pt-1 pl-1 flex items-center gap-3 pr-8">
              <Input
                value={imageSearchInputValue}
                onChange={(event) => setImageSearchInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    triggerImageSearch();
                  }
                }}
                placeholder={t.coverDrawer.searchInputPlaceholder}
                className="h-10 w-[380px] max-w-full focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-0"
              />
              <Button
                type="button"
                className="h-10 min-w-[84px] shrink-0 px-5"
                onClick={triggerImageSearch}
              >
                {t.coverDrawer.searchButton}
              </Button>
            </div>
          ) : null
        }
        maxSelectHint={t.coverDrawer.maxSelect(1)}
        cancelLabel={t.coverDrawer.cancel}
        confirmLabel={t.coverDrawer.confirm}
        confirmDisabled={
          imagePickerTab === IMAGE_PICKER_TAB_UPLOAD
            ? imageUploadCandidates.length === 0
            : imagePickerTab === IMAGE_PICKER_TAB_LIBRARY
              ? imageLibraryCandidates.length === 0
              : imagePickerTab === IMAGE_PICKER_TAB_PROJECT
                ? imageProjectCandidates.length === 0
                : imageSearchCandidates.length === 0
        }
        onConfirm={() =>
          insertSelectedImage(
            imagePickerTab === IMAGE_PICKER_TAB_UPLOAD
              ? imageUploadCandidates[0] ?? ""
              : imagePickerTab === IMAGE_PICKER_TAB_LIBRARY
                ? imageLibraryCandidates[0] ?? ""
                : imagePickerTab === IMAGE_PICKER_TAB_PROJECT
                  ? imageProjectCandidates[0] ?? ""
                  : imageSearchCandidates[0] ?? "",
          )
        }
      />
    </>
  );
}
