"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { marked } from "marked";

import { InputBox } from "@/components/langgraph/workspace/input-box";
import {
  ThreadContext,
  type ThreadContextType,
} from "@/components/langgraph/workspace/messages/context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformLogo } from "@/components/account-management/platform-logo";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import type { PromptInputMessage } from "@/components/langgraph/ai-elements/prompt-input";
import { env } from "@/lib/langgraph/env";
import { cn } from "@/lib/utils";
import { createThread } from "@/lib/langgraph-client";
import { stashPendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import type { AgentThread } from "@/lib/langgraph/core/threads/types";
import {
  deletePersona,
  listPersonas,
  updatePersona,
  type PersonaPlatform,
  type PersonaResponse,
} from "@/lib/api/personas";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { createArtifactTurndownService } from "@/components/langgraph/workspace/artifacts/artifact-editor-turndown";
import { artifactEditorContentClassName } from "@/components/langgraph/workspace/artifacts/artifact-editor-prosemirror-classes";
import {
  MandatoryTitleExtension,
  ensureMandatoryTitleMarkdown,
  mandatoryTitlePlaceholderForNode,
} from "@/components/langgraph/workspace/artifacts/mandatory-title-extension";

const HIGHLIGHTED_PARTS = [
  { text: "AI", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)" },
  { text: "创作专家", gradient: "linear-gradient(135deg,#a855f7,#ec4899)" },
  {
    text: "Creation Expert",
    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
];

function AnimatedTitle({ title }: { title: string }) {
  const segments: { text: string; highlight?: string }[] = [];
  let remaining = title;
  for (const { text } of HIGHLIGHTED_PARTS) {
    const idx = remaining.indexOf(text);
    if (idx >= 0) {
      if (idx > 0) segments.push({ text: remaining.slice(0, idx) });
      segments.push({ text, highlight: text });
      remaining = remaining.slice(idx + text.length);
    }
  }
  if (remaining) segments.push({ text: remaining });

  return (
    <h1 className="flex flex-wrap items-center justify-center gap-0 text-[32px] font-bold leading-tight tracking-tight text-foreground">
      {segments.map((seg, i) => {
        const isHighlight = !!seg.highlight;
        const config = HIGHLIGHTED_PARTS.find((p) => p.text === seg.text);
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={isHighlight ? { scale: 1.05 } : undefined}
            transition={{
              duration: 0.4,
              delay: i * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={
              isHighlight ? "inline-block cursor-default bg-clip-text" : ""
            }
            style={
              isHighlight && config
                ? {
                    backgroundImage: config.gradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : undefined
            }
          >
            {seg.text}
          </motion.span>
        );
      })}
    </h1>
  );
}

export function CreationCenterNewChat() {
  const t = useTranslations("creationCenter.new");
  const tGlobal = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const locale = pathname?.split("/").filter(Boolean)[0] ?? "zh-CN";

  const demoLocked = useMemo(
    () => env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true",
    [],
  );

  const [settings, setSettings] = useLocalSettings();
  const { context } = settings;

  const fakeThread = useMemo(() => ({ messages: [] }), []);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(() =>
    typeof context.persona_id === "string" ? context.persona_id : null,
  );
  const [pendingDeletePersona, setPendingDeletePersona] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletePersonaDialogOpen, setDeletePersonaDialogOpen] = useState(false);
  const [deletePersonaDialogSnapshot, setDeletePersonaDialogSnapshot] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingPersona, setEditingPersona] = useState<PersonaResponse | null>(null);
  const [editPersonaDialogOpen, setEditPersonaDialogOpen] = useState(false);
  const [editPersonaPlatform, setEditPersonaPlatform] = useState<PersonaPlatform>("rednote");
  const [editPersonaMarkdown, setEditPersonaMarkdown] = useState("");
  const editPersonaTurndownRef = useRef(createArtifactTurndownService());
  const { data: personasData, isFetched: personasFetched } = useQuery({
    queryKey: ["personas", "list"],
    queryFn: () => listPersonas(),
    staleTime: 60_000,
  });
  const personas = useMemo(
    () => personasData?.items ?? [],
    [personasData],
  );
  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: string) => deletePersona(personaId),
  });
  const updatePersonaMutation = useMutation({
    mutationFn: async (params: {
      personaId: string;
      payload: { name: string; platform: PersonaPlatform; content: string };
    }) => updatePersona(params.personaId, params.payload),
  });
  const editPersonaEditor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
        }),
        MandatoryTitleExtension,
        Placeholder.configure({
          showOnlyCurrent: false,
          placeholder: ({ editor, node }) =>
            mandatoryTitlePlaceholderForNode(
              editor,
              node,
              t("editPersonaDialog.titlePlaceholder"),
            ),
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        TextStyle,
        Color,
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
      content: "",
      immediatelyRender: false,
      editorProps: {
        attributes: {
          spellcheck: "false",
          autocorrect: "off",
          autocapitalize: "off",
          "data-gramm": "false",
        },
      },
      onUpdate({ editor }) {
        const markdown = editPersonaTurndownRef.current.turndown(editor.getHTML());
        setEditPersonaMarkdown(ensureMandatoryTitleMarkdown(markdown));
      },
    },
    [],
  );

  const personaOptions = useMemo(
    () => personas.map((persona) => ({ id: persona.id, name: persona.name })),
    [personas],
  );
  const platformOptions = useMemo(
    () => [
      { id: "rednote" as const, label: tGlobal("account.platforms.rednote") },
      { id: "toutiao" as const, label: tGlobal("account.platforms.toutiao") },
      { id: "wechat_mp" as const, label: tGlobal("account.platforms.wechat_mp") },
      { id: "zhihu" as const, label: tGlobal("account.platforms.zhihu") },
      { id: "baijiahao" as const, label: tGlobal("account.platforms.baijiahao") },
      { id: "csdn" as const, label: tGlobal("account.platforms.csdn") },
    ],
    [tGlobal],
  );
  const selectedPlatformOption = useMemo(
    () => platformOptions.find((option) => option.id === editPersonaPlatform) ?? null,
    [editPersonaPlatform, platformOptions],
  );
  const personaById = useMemo(
    () => new Map(personas.map((persona) => [persona.id, persona])),
    [personas],
  );

  useEffect(() => {
    const contextPersonaId =
      typeof context.persona_id === "string" ? context.persona_id : null;
    if (contextPersonaId === selectedPersonaId) return;
    if (!contextPersonaId) {
      setSelectedPersonaId(null);
      return;
    }
    if (!personaOptions.some((item) => item.id === contextPersonaId)) return;
    setSelectedPersonaId(contextPersonaId);
  }, [context.persona_id, personaOptions, selectedPersonaId]);

  useEffect(() => {
    if (!personasFetched) return;
    if (!personaOptions.length) {
      setSelectedPersonaId(null);
      if (context.persona_id) {
        setSettings("context", {
          ...context,
          persona_id: undefined,
        });
      }
      return;
    }
    if (!selectedPersonaId) return;
    if (personaOptions.some((x) => x.id === selectedPersonaId)) return;
    setSelectedPersonaId(null);
  }, [context, personaOptions, personasFetched, selectedPersonaId, setSettings]);

  const startThreadWithText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setIsStarting(true);
      try {
        const threadId = await createThread({ metadata: {} });

        const now = new Date().toISOString();
        const optimisticThread = {
          thread_id: threadId,
          created_at: now,
          updated_at: now,
          metadata: {},
          values: { title: "新对话" },
        } as unknown as AgentThread;

        queryClient.setQueriesData(
          {
            queryKey: ["threads", "search"],
            exact: false,
          },
          (oldData: Array<AgentThread> | undefined) => {
            if (!oldData || oldData.length === 0) {
              return [optimisticThread];
            }
            const withoutCurrent = oldData.filter((x) => x.thread_id !== threadId);
            return [optimisticThread, ...withoutCurrent];
          },
        );

        stashPendingInitialMessage({
          threadId,
          text: trimmed,
          personaId: selectedPersonaId,
        });
        setSettings("context", {
          ...context,
          persona_id: selectedPersonaId ?? undefined,
        });
        router.push(`/${locale}/creation-center/${threadId}`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : t("createThreadFailed");
        toast.error(msg);
      } finally {
        setIsStarting(false);
      }
    },
    [context, locale, queryClient, router, selectedPersonaId, setSettings, t],
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (demoLocked) return;
      if (isStarting) return;
      const text = message.text.trim();
      if (!text) return;

      // 这里先仅支持发送文本；附件会在进入聊天页后再由对应逻辑处理。
      await startThreadWithText(text);
    },
    [demoLocked, isStarting, startThreadWithText],
  );

  const handleAddPersona = useCallback(async () => {
    if (demoLocked) return;
    if (isStarting) return;
    await startThreadWithText(t("addPersonaPrompt"));
  }, [demoLocked, isStarting, startThreadWithText, t]);

  const extractNameFromMarkdown = useCallback((markdown: string): string | null => {
    const lines = markdown.split("\n");
    const heading = lines.find((line) => line.trim().startsWith("# "));
    if (!heading) return null;
    const name = heading.replace(/^#\s+/, "").trim();
    return name.length > 0 ? name.slice(0, 128) : null;
  }, []);

  useEffect(() => {
    if (!editPersonaEditor) return;
    if (!editPersonaDialogOpen) return;
    const hydrate = async () => {
      const normalizedMd = ensureMandatoryTitleMarkdown(editPersonaMarkdown ?? "");
      const html = await marked.parse(normalizedMd);
      editPersonaEditor
        .chain()
        .setContent(typeof html === "string" ? html : "", {
          emitUpdate: false,
        })
        .run();
      if (normalizedMd !== editPersonaMarkdown) {
        setEditPersonaMarkdown(normalizedMd);
      }
    };
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在弹窗/人设切换时灌入；列入 editPersonaMarkdown 会在每次输入时重灌编辑器
  }, [editPersonaDialogOpen, editPersonaEditor, editingPersona?.id]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-3xl -translate-y-20 flex-col items-center gap-8">
        {/* 标题区域 */}
        <div className="flex flex-col items-center gap-2 text-center">
          <AnimatedTitle title={t("title")} />
          <p className="text-sm text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        {/* 输入框区域 - 复用线程页 InputBox：上传附件/闪速/深度思考/选择模型 */}
        <div className="w-full">
          <ThreadContext.Provider
            value={{
              thread: fakeThread as unknown as ThreadContextType["thread"],
            }}
          >
            <InputBox
              className={cn(
                "w-full -translate-y-4 overflow-hidden rounded-2xl border border-primary bg-card shadow-[0_0_20px_rgba(124,58,237,0.25)]",
                // Match the original CreationCenterNew textarea sizing/typography.
                "[&_[name='message']]:min-h-[100px]",
                "[&_[name='message']]:border-0",
                "[&_[name='message']]:rounded-none",
                "[&_[name='message']]:focus-visible:ring-0",
                "[&_[name='message']]:resize-none",
                "[&_[name='message']]:px-4",
                "[&_[name='message']]:pt-4",
                "[&_[name='message']]:pb-10",
                "[&_[name='message']]:text-base",
                "[&_[name='message']]:placeholder:text-base",
                // Keep footer addon area text/icons aligned with the thread page (14px).
                "[&_[data-slot='input-group-addon']]:text-sm [&_[data-slot='input-group-addon']_*]:text-sm",
                "[&_[data-slot='input-group-addon']_svg]:size-[14px]",
              )}
              isNewThread={false}
              threadId={"new"}
              autoFocus={false}
              status={"ready"}
              context={context}
              disabled={demoLocked || isStarting}
              clearTextOnSubmit={false}
              onContextChange={(nextContext) =>
                setSettings("context", nextContext)
              }
              addPersonaLabel={t("addPersona")}
              noPersonaLabel={t("noPersona")}
              onAddPersonaClick={handleAddPersona}
              personas={personaOptions}
              selectedPersonaId={selectedPersonaId}
              onPersonaSelect={(personaId) => {
                setSelectedPersonaId(personaId);
                setSettings("context", {
                  ...context,
                  persona_id: personaId ?? undefined,
                });
              }}
              onDeletePersonaRequest={(persona) => {
                setPendingDeletePersona(persona);
                setDeletePersonaDialogSnapshot(persona);
                setDeletePersonaDialogOpen(true);
              }}
              onEditPersonaRequest={(persona) => {
                const fullPersona = personaById.get(persona.id);
                if (!fullPersona) return;
                setEditingPersona(fullPersona);
                setEditPersonaPlatform(fullPersona.platform);
                setEditPersonaMarkdown(fullPersona.content);
                setEditPersonaDialogOpen(true);
              }}
              onSubmit={handleSubmit}
              onStop={undefined}
            />
          </ThreadContext.Provider>
          {demoLocked && (
            <div className="text-muted-foreground/67 w-full -mt-2 text-center text-xs">
              {t("notAvailableInDemoMode")}
            </div>
          )}
        </div>
      </div>
      <DeleteConfirmDialog
        open={deletePersonaDialogOpen}
        onOpenChange={(open) => {
          setDeletePersonaDialogOpen(open);
          if (!open) {
            setPendingDeletePersona(null);
          }
        }}
        onConfirm={async () => {
          if (!pendingDeletePersona) return;
          try {
            await deletePersonaMutation.mutateAsync(pendingDeletePersona.id);
            setDeletePersonaDialogOpen(false);
            setPendingDeletePersona(null);
            if (selectedPersonaId === pendingDeletePersona.id) {
              setSelectedPersonaId(null);
              setSettings("context", {
                ...context,
                persona_id: undefined,
              });
            }
            await queryClient.invalidateQueries({
              queryKey: ["personas", "list"],
            });
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : t("deletePersonaFailed"),
            );
          }
        }}
        closeLabel={t("deletePersonaDialog.close")}
        title={t("deletePersonaDialog.title")}
        description={t("deletePersonaDialog.description", {
          name: deletePersonaDialogSnapshot?.name ?? "",
        })}
        cancelLabel={t("deletePersonaDialog.cancel")}
        confirmLabel={t("deletePersonaDialog.confirm")}
        isPending={deletePersonaMutation.isPending}
      />
      <Dialog
        open={editPersonaDialogOpen}
        onOpenChange={(open) => {
          setEditPersonaDialogOpen(open);
          if (!open) {
            setEditingPersona(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("editPersonaDialog.title")}</DialogTitle>
            <DialogDescription>{t("editPersonaDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t("editPersonaDialog.platformLabel")}
              </div>
              <Select
                value={editPersonaPlatform}
                onValueChange={(value) => setEditPersonaPlatform(value as PersonaPlatform)}
              >
                <SelectTrigger className="w-56">
                  <SelectValue className="sr-only" />
                  <span className="flex min-w-0 items-center gap-2">
                    {selectedPlatformOption ? (
                      <>
                        <PlatformLogo
                          platformId={selectedPlatformOption.id}
                          size={18}
                          className="shrink-0 rounded-sm"
                        />
                        <span className="truncate">{selectedPlatformOption.label}</span>
                      </>
                    ) : null}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((option) => (
                    <SelectItem
                      key={option.id}
                      value={option.id}
                      className="[&>span.absolute.right-2]:size-5 [&>span.absolute.right-2_svg]:size-4"
                    >
                      <PlatformLogo
                        platformId={option.id}
                        size={18}
                        className="shrink-0 rounded-sm"
                      />
                      <span>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t("editPersonaDialog.markdownLabel")}
              </div>
              <div className="rounded-md border border-border bg-background">
                <div className="max-h-[420px] overflow-auto p-4">
                  <EditorContent
                    className={cn(artifactEditorContentClassName, "min-h-[320px]")}
                    editor={editPersonaEditor}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditPersonaDialogOpen(false);
                setEditingPersona(null);
              }}
              disabled={updatePersonaMutation.isPending}
            >
              {t("editPersonaDialog.cancel")}
            </Button>
            <Button
              onClick={async () => {
                if (!editingPersona) return;
                const content = editPersonaMarkdown.trim();
                if (!content) {
                  toast.error(t("editPersonaDialog.emptyMarkdown"));
                  return;
                }
                const name = extractNameFromMarkdown(content);
                if (!name) {
                  toast.error(t("editPersonaDialog.titleRequired"));
                  return;
                }
                try {
                  await updatePersonaMutation.mutateAsync({
                    personaId: editingPersona.id,
                    payload: {
                      name,
                      platform: editPersonaPlatform,
                      content,
                    },
                  });
                  setEditPersonaDialogOpen(false);
                  setEditingPersona(null);
                  await queryClient.invalidateQueries({
                    queryKey: ["personas", "list"],
                  });
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : t("editPersonaDialog.saveFailed"),
                  );
                }
              }}
              disabled={updatePersonaMutation.isPending}
            >
              {t("editPersonaDialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
