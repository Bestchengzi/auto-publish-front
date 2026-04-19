"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import type { PromptInputMessage } from "@/components/langgraph/ai-elements/prompt-input";
import { InputBox } from "@/components/langgraph/workspace/input-box";
import {
  ThreadContext,
  type ThreadContextType,
} from "@/components/langgraph/workspace/messages/context";
import { createThread } from "@/lib/langgraph-client";
import { stashPendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import type { AgentThread } from "@/lib/langgraph/core/threads/types";
import {
  deletePersona,
  listPersonas,
  type PersonaResponse,
} from "@/lib/api/personas";
import { cn } from "@/lib/utils";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";
import type { FileUIPart } from "ai";

const HIGHLIGHTED_PARTS = [
  { text: "AI", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)" },
  {
    text: "\u521b\u4f5c\u4e13\u5bb6",
    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
  {
    text: "Creation Expert",
    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
];

const EditPersonaDialog = dynamic(
  () =>
    import("@/components/creation-center/edit-persona-dialog").then(
      (module) => module.EditPersonaDialog,
    ),
  {
    ssr: false,
  },
);

function AnimatedTitle({ title }: { title: string }) {
  const segments: { text: string; highlight?: string }[] = [];
  let remaining = title;

  for (const { text } of HIGHLIGHTED_PARTS) {
    const idx = remaining.indexOf(text);
    if (idx >= 0) {
      if (idx > 0) {
        segments.push({ text: remaining.slice(0, idx) });
      }
      segments.push({ text, highlight: text });
      remaining = remaining.slice(idx + text.length);
    }
  }

  if (remaining) {
    segments.push({ text: remaining });
  }

  return (
    <h1 className="flex flex-wrap items-center justify-center gap-0 text-[32px] font-bold leading-tight tracking-tight text-foreground">
      {segments.map((segment, index) => {
        const isHighlight = segment.highlight != null;
        const config = HIGHLIGHTED_PARTS.find((part) => part.text === segment.text);

        return (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={isHighlight ? { scale: 1.05 } : undefined}
            transition={{
              duration: 0.4,
              delay: index * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={isHighlight ? "inline-block cursor-default bg-clip-text" : ""}
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
            {segment.text}
          </motion.span>
        );
      })}
    </h1>
  );
}

export function CreationCenterNewChat() {
  const t = useTranslations("creationCenter.new");
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const locale = pathname?.split("/").filter(Boolean)[0] ?? "zh-CN";

  const [settings, setSettings] = useLocalSettings();
  const { ready: authReady, isLoggedIn } = useAuthLoggedIn();
  const canUseAuthFeatures = authReady && isLoggedIn;
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

  const { data: personasData, isFetched: personasFetched } = useQuery({
    queryKey: ["personas", "list"],
    queryFn: () => listPersonas(),
    staleTime: 60_000,
    enabled: canUseAuthFeatures,
  });
  const personas = useMemo(
    () => (canUseAuthFeatures ? (personasData?.items ?? []) : []),
    [canUseAuthFeatures, personasData],
  );
  const personaOptions = useMemo(
    () => personas.map((persona) => ({ id: persona.id, name: persona.name })),
    [personas],
  );
  const personaById = useMemo(
    () => new Map(personas.map((persona) => [persona.id, persona])),
    [personas],
  );

  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: string) => deletePersona(personaId),
  });

  useEffect(() => {
    if (!authReady) return;
    if (isLoggedIn) return;

    setSelectedPersonaId(null);

    if (
      context.persona_id !== undefined ||
      context.model_name !== undefined ||
      context.mode !== "flash" ||
      context.reasoning_effort !== undefined
    ) {
      setSettings("context", {
        ...context,
        persona_id: undefined,
        model_name: undefined,
        mode: "flash",
        reasoning_effort: undefined,
      });
    }
  }, [authReady, context, isLoggedIn, setSettings]);

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
    if (personaOptions.some((persona) => persona.id === selectedPersonaId)) return;

    setSelectedPersonaId(null);
  }, [context, personaOptions, personasFetched, selectedPersonaId, setSettings]);

  const startThreadWithText = useCallback(
    async (text: string, files: FileUIPart[] = []) => {
      const trimmed = text.trim();
      if (!trimmed && files.length === 0) return;

      setIsStarting(true);
      try {
        const threadId = await createThread({ metadata: {} });
        const now = new Date().toISOString();
        const optimisticThread = {
          thread_id: threadId,
          created_at: now,
          updated_at: now,
          metadata: {},
          values: { title: t("newConversationTitle") },
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

            const withoutCurrent = oldData.filter((item) => item.thread_id !== threadId);
            return [optimisticThread, ...withoutCurrent];
          },
        );

        stashPendingInitialMessage({
          threadId,
          text: trimmed,
          personaId: selectedPersonaId,
          ...(files.length > 0 ? { files } : {}),
        });
        setSettings("context", {
          ...context,
          persona_id: selectedPersonaId ?? undefined,
        });
        router.push(`/${locale}/creation-center/${threadId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("createThreadFailed"));
      } finally {
        setIsStarting(false);
      }
    },
    [context, locale, queryClient, router, selectedPersonaId, setSettings, t],
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (isStarting) return;

      const text = message.text.trim();
      const files = message.files ?? [];
      if (!text && files.length === 0) return;

      await startThreadWithText(text, files);
    },
    [isStarting, startThreadWithText],
  );

  const handleAddPersona = useCallback(async () => {
    if (isStarting) return;
    await startThreadWithText(t("addPersonaPrompt"));
  }, [isStarting, startThreadWithText, t]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-3xl -translate-y-20 flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <AnimatedTitle title={t("title")} />
          <p className="text-sm text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <div className="w-full">
          <ThreadContext.Provider
            value={{
              thread: fakeThread as unknown as ThreadContextType["thread"],
            }}
          >
            <InputBox
              className={cn(
                "w-full -translate-y-4 overflow-hidden rounded-2xl border border-primary bg-card shadow-[0_0_20px_rgba(124,58,237,0.25)]",
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
                "[&_[data-slot='input-group-addon']]:text-sm [&_[data-slot='input-group-addon']_*]:text-sm",
                "[&_[data-slot='input-group-addon']_svg]:size-[14px]",
              )}
              isNewThread={false}
              threadId="new"
              autoFocus={false}
              status="ready"
              context={context}
              disabled={isStarting}
              clearTextOnSubmit={false}
              onContextChange={(nextContext) => setSettings("context", nextContext)}
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
              }}
              showPersonaManagementActions
              onSubmit={handleSubmit}
              onStop={undefined}
            />
          </ThreadContext.Provider>
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

      {editingPersona ? (
        <EditPersonaDialog
          open={editingPersona != null}
          persona={editingPersona}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPersona(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
