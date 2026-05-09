"use client";

import type { ChatStatus } from "ai";
import {
  CheckIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  LightbulbIcon,
  NewspaperIcon,
  PaperclipIcon,
  PencilIcon,
  PlusIcon,
  RocketIcon,
  SendIcon,
  Trash2Icon,
  ZapIcon,
  GlobeIcon,
} from "lucide-react";
// import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHoverCard,
  PromptInputHoverCardContent,
  PromptInputHoverCardTrigger,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  usePromptInputController,
  type PromptInputMessage,
} from "@/components/langgraph/ai-elements/prompt-input";
// import { Button } from "@/components/ui/button";
// import { ConfettiButton } from "@/components/ui/confetti-button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
// import { getBackendBaseURL } from "@/lib/langgraph/core/config";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import { useModels } from "@/lib/langgraph/core/models/hooks";
import type { AgentThreadContext } from "@/lib/langgraph/core/threads";
// import { textOfMessage } from "@/lib/langgraph/core/threads/utils";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";
// import { request } from "@/lib/request";
import { cn } from "@/lib/utils";

// import {
//   Suggestion,
//   Suggestions,
// } from "@/components/langgraph/ai-elements/suggestion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// import { useThread } from "./messages/context";
import { ModeHoverGuide } from "./mode-hover-guide";
import { Tooltip } from "./tooltip";

type InputMode = "flash" | "thinking" | "pro" | "ultra";
const SHOW_REASONING_EFFORT = false;

type ModelSelectorNameProps = ComponentProps<"span">;

// ModelSelectorName was previously imported from `ai-elements/model-selector`.
// After switching the model selector to a simple dropdown, only this styling helper is needed.
const ModelSelectorName = ({ className, ...props }: ModelSelectorNameProps) => (
  <span
    className={cn("flex-1 truncate text-left text-xs", className)}
    {...props}
  />
);

function getResolvedMode(
  mode: InputMode | undefined,
  supportsThinking: boolean | undefined,
): InputMode {
  // Only fallback to flash when the model explicitly declares no thinking support.
  if (supportsThinking === false && mode !== "flash") {
    return "flash";
  }
  if (mode) {
    return mode;
  }
  return "flash";
}

export function InputBox({
  className,
  disabled,
  autoFocus,
  status = "ready",
  context,
  extraHeader,
  isNewThread,
  threadId: _threadId,
  initialValue,
  placeholder,
  onContextChange,
  onSubmit,
  onStop,
  addPersonaLabel,
  noPersonaLabel,
  onAddPersonaClick,
  personas,
  selectedPersonaId,
  onPersonaSelect,
  onDeletePersonaRequest,
  onEditPersonaRequest,
  showPersonaManagementActions = false,
  toolbarVariant = "default",
  attachmentsPlacement = "default",
  selectedTopic,
  onClearSelectedTopic,
  submitLabel,
  ...props
}: Omit<ComponentProps<typeof PromptInput>, "onSubmit"> & {
  assistantId?: string | null;
  status?: ChatStatus;
  disabled?: boolean;
  context: Omit<
    AgentThreadContext,
    "thread_id" | "is_plan_mode" | "thinking_enabled" | "subagent_enabled"
  > & {
    mode: "flash" | "thinking" | "pro" | "ultra" | undefined;
    reasoning_effort?: "minimal" | "low" | "medium" | "high";
  };
  extraHeader?: React.ReactNode;
  isNewThread?: boolean;
  threadId: string;
  initialValue?: string;
  placeholder?: string;
  onContextChange?: (
    context: Omit<
      AgentThreadContext,
      "thread_id" | "is_plan_mode" | "thinking_enabled" | "subagent_enabled"
    > & {
      mode: "flash" | "thinking" | "pro" | "ultra" | undefined;
      reasoning_effort?: "minimal" | "low" | "medium" | "high";
    },
  ) => void;
  onSubmit?: (message: PromptInputMessage) => void;
  onStop?: () => void;
  addPersonaLabel?: string;
  noPersonaLabel?: string;
  onAddPersonaClick?: () => void;
  personas?: Array<{ id: string; name: string }>;
  selectedPersonaId?: string | null;
  onPersonaSelect?: (personaId: string | null) => void;
  onDeletePersonaRequest?: (persona: { id: string; name: string }) => void;
  onEditPersonaRequest?: (persona: { id: string; name: string }) => void;
  showPersonaManagementActions?: boolean;
  toolbarVariant?: "default" | "attachmentsOnly";
  attachmentsPlacement?: "default" | "underHeader";
  selectedTopic?: {
    title: string;
    typeLabel: string;
  } | null;
  onClearSelectedTopic?: () => void;
  submitLabel?: string;
}) {
  const { t } = useI18n();
  void _threadId;
  // 建议功能暂时停用：保留原逻辑位置，后续需要恢复时再放开。
  // const searchParams = useSearchParams();
  const { ready: authReady, isLoggedIn } = useAuthLoggedIn();
  const canUseAuthFeatures = authReady && isLoggedIn;
  const { models } = useModels({ enabled: canUseAuthFeatures });
  // const { thread } = useThread();
  const { textInput } = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const promptRootRef = useRef<HTMLDivElement | null>(null);

  // 建议接口 `/api/threads/:threadId/suggestions` 相关状态暂时停用。
  // const [followups, setFollowups] = useState<string[]>([]);
  // const [followupsHidden, setFollowupsHidden] = useState(false);
  // const [followupsLoading, setFollowupsLoading] = useState(false);

  // const [confirmOpen, setConfirmOpen] = useState(false);
  // const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(
  //   null,
  // );
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [reasoningEffortMenuOpen, setReasoningEffortMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

  useEffect(() => {
    if (!canUseAuthFeatures && modeMenuOpen) {
      setModeMenuOpen(false);
    }
  }, [canUseAuthFeatures, modeMenuOpen]);

  useEffect(() => {
    if (models.length === 0) {
      return;
    }
    const currentModel = models.find((m) => m.name === context.model_name);
    const fallbackModel = currentModel ?? models[0]!;
    const supportsThinking = fallbackModel.supports_thinking;
    const nextModelName = fallbackModel.name;
    const nextMode = getResolvedMode(context.mode, supportsThinking);

    if (context.model_name === nextModelName && context.mode === nextMode) {
      return;
    }

    onContextChange?.({
      ...context,
      model_name: nextModelName,
      mode: nextMode,
    });
  }, [context, models, onContextChange]);

  const selectedModel = useMemo(() => {
    if (models.length === 0) {
      return undefined;
    }
    return models.find((m) => m.name === context.model_name) ?? models[0];
  }, [context.model_name, models]);

  const supportThinking = useMemo(
    () => selectedModel?.supports_thinking !== false,
    [selectedModel],
  );

  const supportReasoningEffort = useMemo(
    () => selectedModel?.supports_reasoning_effort ?? false,
    [selectedModel],
  );

  const handleModelSelect = useCallback(
    (model_name: string) => {
      const model = models.find((m) => m.name === model_name);
      if (!model) {
        return;
      }
      onContextChange?.({
        ...context,
        model_name,
        mode: getResolvedMode(context.mode, model.supports_thinking),
        reasoning_effort: context.reasoning_effort,
      });
    },
    [onContextChange, context, models],
  );

  const handleModeSelect = useCallback(
    (mode: InputMode) => {
      onContextChange?.({
        ...context,
        mode: getResolvedMode(mode, supportThinking),
        reasoning_effort:
          mode === "ultra"
            ? "high"
            : mode === "pro"
              ? "medium"
              : mode === "thinking"
                ? "low"
                : "minimal",
      });
    },
    [onContextChange, context, supportThinking],
  );

  const handleReasoningEffortSelect = useCallback(
    (effort: "minimal" | "low" | "medium" | "high") => {
      onContextChange?.({
        ...context,
        reasoning_effort: effort,
      });
    },
    [onContextChange, context],
  );

  const selectedMode = getResolvedMode(context.mode, supportThinking);
  const searchEnabled = context.search_enabled !== false;
  const hasSelectedTopic = Boolean(selectedTopic);
  const hasSubmitContent =
    textInput.value.trim().length > 0 ||
    attachments.files.length > 0 ||
    hasSelectedTopic;
  const submitDisabled =
    disabled ||
    !canUseAuthFeatures ||
    (status !== "streaming" && !hasSubmitContent);
  const selectedPersona = useMemo(() => {
    if (!personas || personas.length === 0) return null;
    if (selectedPersonaId) {
      const found = personas.find((item) => item.id === selectedPersonaId);
      if (found) return found;
    }
    return null;
  }, [personas, selectedPersonaId]);
  const canEditPersona =
    showPersonaManagementActions && Boolean(onEditPersonaRequest);
  const canDeletePersona =
    showPersonaManagementActions && Boolean(onDeletePersonaRequest);
  const hasPersonaManagementActions = canEditPersona || canDeletePersona;
  const attachmentsOnlyToolbar = toolbarVariant === "attachmentsOnly";
  const attachmentsUnderHeader = attachmentsPlacement === "underHeader";
  const attachmentsNearFooter = attachmentsPlacement === "underHeader";
  const hasAttachments = attachments.files.length > 0;
  const hasHeaderItems = hasAttachments || hasSelectedTopic;
  const headerItems = hasHeaderItems ? (
    <div
      className={cn(
        "relative z-10 flex w-full flex-wrap items-center gap-2 p-3",
        attachmentsNearFooter && "px-[23px] pt-0 pb-0.5",
      )}
    >
      {selectedTopic ? (
        <div className="max-w-60">
          <PromptInputHoverCard>
            <PromptInputHoverCardTrigger
              render={
                <div className="group border-border hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 relative flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-1.5 text-sm font-medium transition-all select-none">
                  <div className="relative size-5 shrink-0">
                    <div className="bg-background absolute inset-0 flex size-5 items-center justify-center overflow-hidden rounded transition-opacity group-hover:opacity-0">
                      <div className="text-muted-foreground flex size-5 items-center justify-center">
                        <NewspaperIcon className="size-3.5 text-rose-500" />
                      </div>
                    </div>
                    {onClearSelectedTopic ? (
                      <button
                        aria-label="移除选题"
                        className="absolute inset-0 flex size-5 cursor-pointer items-center justify-center rounded p-0 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-accent"
                        onClick={(event) => {
                          event.stopPropagation();
                          onClearSelectedTopic();
                        }}
                        type="button"
                      >
                        <span className="text-base leading-none">×</span>
                        <span className="sr-only">移除</span>
                      </button>
                    ) : null}
                  </div>
                  <span className="flex-1 truncate">{selectedTopic.title}</span>
                </div>
              }
            />
            <PromptInputHoverCardContent className="w-[min(24rem,calc(100vw-2rem))] p-2">
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1 space-y-1 px-0.5">
                    <h4 className="truncate text-sm leading-none font-semibold">
                      {selectedTopic.title}
                    </h4>
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {selectedTopic.typeLabel}
                    </p>
                  </div>
                </div>
              </div>
            </PromptInputHoverCardContent>
          </PromptInputHoverCard>
        </div>
      ) : null}
      {attachments.files.map((attachment) => (
        <div className="max-w-60" key={attachment.id}>
          <PromptInputAttachment data={attachment} />
        </div>
      ))}
    </div>
  ) : null;

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (status === "streaming") {
        onStop?.();
        return;
      }
      const hasText = Boolean(message.text?.trim());
      const hasFiles = (message.files?.length ?? 0) > 0;
      if (!hasText && !hasFiles && !hasSelectedTopic) {
        return;
      }
      // 建议能力暂时停用。
      // setFollowups([]);
      // setFollowupsHidden(false);
      // setFollowupsLoading(false);
      onSubmit?.(message);
    },
    [hasSelectedTopic, onSubmit, onStop, status],
  );

  /*
  const requestFormSubmit = useCallback(() => {
    const form = promptRootRef.current?.querySelector("form");
    form?.requestSubmit();
  }, []);

  const confirmReplaceAndSend = useCallback(() => {
    if (!pendingSuggestion) {
      setConfirmOpen(false);
      return;
    }
    textInput.setInput(pendingSuggestion);
    setFollowupsHidden(true);
    setConfirmOpen(false);
    setPendingSuggestion(null);
    setTimeout(() => requestFormSubmit(), 0);
  }, [pendingSuggestion, requestFormSubmit, textInput]);

  const confirmAppendAndSend = useCallback(() => {
    if (!pendingSuggestion) {
      setConfirmOpen(false);
      return;
    }
    const current = (textInput.value ?? "").trim();
    const next = current
      ? `${current}\n${pendingSuggestion}`
      : pendingSuggestion;
    textInput.setInput(next);
    setFollowupsHidden(true);
    setConfirmOpen(false);
    setPendingSuggestion(null);
    setTimeout(() => requestFormSubmit(), 0);
  }, [pendingSuggestion, requestFormSubmit, textInput]);

  useEffect(() => {
    const streaming = status === "streaming";
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = streaming;
    if (!wasStreaming || streaming) {
      return;
    }

    if (disabled) {
      return;
    }

    const lastAi = [...thread.messages].reverse().find((m) => m.type === "ai");
    const lastAiId = lastAi?.id ?? null;
    if (!lastAiId || lastAiId === lastGeneratedForAiIdRef.current) {
      return;
    }
    lastGeneratedForAiIdRef.current = lastAiId;

    const recent = thread.messages
      .filter((m) => m.type === "human" || m.type === "ai")
      .map((m) => {
        const role = m.type === "human" ? "user" : "assistant";
        const content = textOfMessage(m) ?? "";
        return { role, content };
      })
      .filter((m) => m.content.trim().length > 0)
      .slice(-6);

    if (recent.length === 0) {
      return;
    }

    const controller = new AbortController();
    setFollowupsHidden(false);
    setFollowupsLoading(true);
    setFollowups([]);

    request<{ suggestions?: string[] }>(
      `${getBackendBaseURL()}/api/threads/${threadId}/suggestions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: recent,
          n: 3,
          model_name: context.model_name ?? undefined,
        }),
        signal: controller.signal,
      },
    )
      .then((data) => {
        const suggestions = (data.suggestions ?? [])
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter((s) => s.length > 0)
          .slice(0, 5);
        setFollowups(suggestions);
      })
      .catch(() => {
        setFollowups([]);
      })
      .finally(() => {
        setFollowupsLoading(false);
      });

    return () => controller.abort();
  }, [context.model_name, disabled, status, thread.messages, threadId]);
  */

  return (
    <div ref={promptRootRef} className="relative">
      <PromptInput
        className={cn(
          "bg-background/85 rounded-2xl backdrop-blur-sm transition-all duration-300 ease-out *:data-[slot='input-group']:rounded-2xl",
          className,
          attachmentsUnderHeader &&
            hasHeaderItems &&
            "[&_[name='message']]:min-h-[120px]",
        )}
        disabled={disabled}
        globalDrop
        multiple
        onSubmit={handleSubmit}
        {...props}
      >
        {extraHeader && (
          // <div className="absolute top-0 right-0 left-0 z-10">
          //   <div className="absolute right-0 bottom-0 left-0 flex items-center justify-center">
          //     {extraHeader}
          //   </div>
          // </div>
          <div></div>
        )}
        {!attachmentsNearFooter ? headerItems : null}
        <PromptInputBody className="absolute top-0 right-0 left-0 z-3">
          <PromptInputTextarea
            className={cn("size-full")}
            disabled={disabled}
            placeholder={placeholder ?? t.inputBox.placeholder}
            autoFocus={autoFocus}
            defaultValue={initialValue}
          />
        </PromptInputBody>
        {attachmentsNearFooter ? headerItems : null}
        <PromptInputFooter
          className={cn("flex", attachmentsNearFooter && hasHeaderItems && "pt-0")}
        >
          <PromptInputTools>
            {/* TODO: Add more connectors here
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger className="px-2!" />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments
                label={t.inputBox.addAttachments}
              />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu> */}
            <AddAttachmentsButton
              className={cn("px-2!", attachmentsOnlyToolbar && "gap-1.5!")}
              disabled={disabled || !canUseAuthFeatures}
              label={attachmentsOnlyToolbar ? "参考图" : undefined}
            />
            {!attachmentsOnlyToolbar ? (
              <>
            <Tooltip
              content={
                searchEnabled
                  ? t.inputBox.smartSearchTooltipOn
                  : t.inputBox.smartSearchTooltipOff
              }
            >
              <PromptInputButton
                type="button"
                className={cn(
                  "gap-1! px-2!",
                  searchEnabled
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:text-muted-foreground",
                )}
                disabled={disabled || !canUseAuthFeatures}
                aria-pressed={searchEnabled}
                onClick={() =>
                  onContextChange?.({
                    ...context,
                    search_enabled: !searchEnabled,
                  })
                }
              >
                <GlobeIcon className="size-3 shrink-0" />
                <span className="max-w-[5.5rem] truncate text-xs font-normal sm:max-w-none">
                  {t.inputBox.smartSearch}
                </span>
              </PromptInputButton>
            </Tooltip>
            <PromptInputActionMenu
              open={modeMenuOpen}
              onOpenChange={setModeMenuOpen}
            >
              <ModeHoverGuide mode={selectedMode}>
                <PromptInputActionMenuTrigger
                  className="gap-1! px-2!"
                  disabled={disabled || !canUseAuthFeatures}
                >
                  <div>
                    {selectedMode === "flash" && <ZapIcon className="size-3" />}
                    {selectedMode === "thinking" && (
                      <LightbulbIcon className="size-3" />
                    )}
                    {selectedMode === "pro" && (
                      <GraduationCapIcon className="size-3" />
                    )}
                    {selectedMode === "ultra" && (
                      <RocketIcon className="size-3 text-[#dabb5e]" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "text-xs font-normal",
                      selectedMode === "ultra" ? "golden-text" : "",
                    )}
                  >
                    {(selectedMode === "flash" && t.inputBox.flashMode) ||
                      (selectedMode === "thinking" &&
                        t.inputBox.reasoningMode) ||
                      (selectedMode === "pro" && t.inputBox.proMode) ||
                      (selectedMode === "ultra" && t.inputBox.ultraMode)}
                  </div>
                </PromptInputActionMenuTrigger>
              </ModeHoverGuide>
              <PromptInputActionMenuContent className="w-80">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    {t.inputBox.mode}
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={selectedMode}
                    onValueChange={(value) => {
                      if (
                        value === "flash" ||
                        value === "thinking" ||
                        value === "pro" ||
                        value === "ultra"
                      ) {
                        handleModeSelect(value);
                        setModeMenuOpen(false);
                      }
                    }}
                  >
                    <DropdownMenuRadioItem value="flash">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 font-bold">
                          <ZapIcon
                            className={cn(
                              "mr-2 size-4",
                              selectedMode === "flash" &&
                                "text-accent-foreground",
                            )}
                          />
                          {t.inputBox.flashMode}
                        </div>
                        <div className="pl-7 text-xs">
                          {t.inputBox.flashModeDescription}
                        </div>
                      </div>
                    </DropdownMenuRadioItem>
                    {supportThinking && (
                      <>
                        <DropdownMenuRadioItem value="thinking">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1 font-bold">
                              <LightbulbIcon
                                className={cn(
                                  "mr-2 size-4",
                                  selectedMode === "thinking" &&
                                    "text-accent-foreground",
                                )}
                              />
                              {t.inputBox.reasoningMode}
                            </div>
                            <div className="pl-7 text-xs">
                              {t.inputBox.reasoningModeDescription}
                            </div>
                          </div>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="pro">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1 font-bold">
                              <GraduationCapIcon
                                className={cn(
                                  "mr-2 size-4",
                                  selectedMode === "pro" &&
                                    "text-accent-foreground",
                                )}
                              />
                              {t.inputBox.proMode}
                            </div>
                            <div className="pl-7 text-xs">
                              {t.inputBox.proModeDescription}
                            </div>
                          </div>
                        </DropdownMenuRadioItem>
                        {/* <DropdownMenuRadioItem value="ultra">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1 font-bold">
                              <RocketIcon
                                className={cn(
                                  "mr-2 size-4",
                                  selectedMode === "ultra" && "text-[#dabb5e]",
                                )}
                              />
                              <div
                                className={cn(
                                  selectedMode === "ultra" && "golden-text",
                                )}
                              >
                                {t.inputBox.ultraMode}
                              </div>
                            </div>
                            <div className="pl-7 text-xs">
                              {t.inputBox.ultraModeDescription}
                            </div>
                          </div>
                        </DropdownMenuRadioItem> */}
                      </>
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            {personas && personas.length > 0 && onPersonaSelect && (
              <DropdownMenu open={personaMenuOpen} onOpenChange={setPersonaMenuOpen}>
                <DropdownMenuTrigger
                  className="inline-flex border-0 bg-transparent p-0 shadow-none"
                  render={
                    <PromptInputButton
                      className="gap-1! px-2!"
                      disabled={disabled || !canUseAuthFeatures}
                    >
                      <span className="max-w-28 truncate text-xs font-normal">
                        {selectedPersona?.name ?? noPersonaLabel ?? ""}
                      </span>
                      <ChevronDownIcon className="size-3 opacity-70" />
                    </PromptInputButton>
                  }
                />
                <DropdownMenuContent align="start" className="w-56">
                  {addPersonaLabel && onAddPersonaClick && (
                    <DropdownMenuItem
                      onClick={() => {
                        setPersonaMenuOpen(false);
                        onAddPersonaClick();
                      }}
                    >
                      <PlusIcon className="size-4" />
                      <span className="truncate">{addPersonaLabel}</span>
                    </DropdownMenuItem>
                  )}
                  {addPersonaLabel && onAddPersonaClick && <DropdownMenuSeparator />}
                  {personas.map((persona) => (
                    <DropdownMenuItem
                      className="group"
                      key={persona.id}
                      onClick={() => {
                        onPersonaSelect(persona.id);
                        setPersonaMenuOpen(false);
                      }}
                      >
                      <span className="truncate">{persona.name}</span>
                      <span
                        className={cn(
                          "relative ml-auto flex h-5 items-center justify-end",
                          hasPersonaManagementActions ? "w-12" : "w-4",
                        )}
                      >
                        {hasPersonaManagementActions ? (
                          <span className="absolute inset-0 z-10 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {canEditPersona ? (
                              <Tooltip content={t.common.edit}>
                                <button
                                  type="button"
                                  className="pointer-events-none inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground group-hover:pointer-events-auto"
                                  aria-label={t.common.edit}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    setPersonaMenuOpen(false);
                                    onEditPersonaRequest?.({
                                      id: persona.id,
                                      name: persona.name,
                                    });
                                  }}
                                >
                                  <PencilIcon className="size-[13px]" />
                                </button>
                              </Tooltip>
                            ) : null}
                            {canDeletePersona ? (
                              <Tooltip content={t.common.delete}>
                                <button
                                  type="button"
                                  className="pointer-events-none inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-destructive group-hover:pointer-events-auto"
                                  aria-label={t.common.delete}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    setPersonaMenuOpen(false);
                                    onDeletePersonaRequest?.({
                                      id: persona.id,
                                      name: persona.name,
                                    });
                                  }}
                                >
                                  <Trash2Icon className="size-[13px]" />
                                </button>
                              </Tooltip>
                            ) : null}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            "pointer-events-none absolute inset-0 flex items-center justify-end transition-opacity",
                            hasPersonaManagementActions && "group-hover:opacity-0",
                          )}
                        >
                          {selectedPersona?.id === persona.id ? (
                            <CheckIcon className="size-4" />
                          ) : (
                            <div className="size-4" />
                          )}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {noPersonaLabel && <DropdownMenuSeparator />}
                  {noPersonaLabel && (
                    <DropdownMenuItem
                      onClick={() => {
                        onPersonaSelect(null);
                        setPersonaMenuOpen(false);
                      }}
                    >
                      <span className="truncate">{noPersonaLabel}</span>
                      <span className="ml-auto inline-flex items-center">
                        {selectedPersonaId == null ? (
                          <CheckIcon className="size-4" />
                        ) : (
                          <div className="size-4" />
                        )}
                      </span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {addPersonaLabel &&
              onAddPersonaClick &&
              (!personas || personas.length === 0) && (
                <PromptInputButton
                  className="gap-1! px-2!"
                  onClick={() => {
                    if (disabled) return;
                    if (!canUseAuthFeatures) {
                      window.dispatchEvent(new Event("media-auth-open-login"));
                      return;
                    }
                    onAddPersonaClick();
                  }}
                >
                  <PlusIcon className="size-3" />
                  <span className="text-xs font-normal">{addPersonaLabel}</span>
                </PromptInputButton>
              )}
            {SHOW_REASONING_EFFORT &&
              supportReasoningEffort &&
              selectedMode !== "flash" && (
              <PromptInputActionMenu
                open={reasoningEffortMenuOpen}
                onOpenChange={setReasoningEffortMenuOpen}
              >
                <PromptInputActionMenuTrigger className="gap-1! px-2!">
                  <div className="text-xs font-normal">
                    {t.inputBox.reasoningEffort}:
                    {context.reasoning_effort === "minimal" &&
                      " " + t.inputBox.reasoningEffortMinimal}
                    {context.reasoning_effort === "low" &&
                      " " + t.inputBox.reasoningEffortLow}
                    {context.reasoning_effort === "medium" &&
                      " " + t.inputBox.reasoningEffortMedium}
                    {context.reasoning_effort === "high" &&
                      " " + t.inputBox.reasoningEffortHigh}
                  </div>
                </PromptInputActionMenuTrigger>
                <PromptInputActionMenuContent className="w-70">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-muted-foreground text-xs">
                      {t.inputBox.reasoningEffort}
                    </DropdownMenuLabel>
                    <PromptInputActionMenuItem
                      className={cn(
                        context.reasoning_effort === "minimal"
                          ? "text-accent-foreground"
                          : "text-muted-foreground/65",
                      )}
                      onSelect={() => handleReasoningEffortSelect("minimal")}
                      onClick={() => setReasoningEffortMenuOpen(false)}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 font-bold">
                          {t.inputBox.reasoningEffortMinimal}
                        </div>
                        <div className="pl-2 text-xs">
                          {t.inputBox.reasoningEffortMinimalDescription}
                        </div>
                      </div>
                      {context.reasoning_effort === "minimal" ? (
                        <CheckIcon className="ml-auto size-4" />
                      ) : (
                        <div className="ml-auto size-4" />
                      )}
                    </PromptInputActionMenuItem>
                    <PromptInputActionMenuItem
                      className={cn(
                        context.reasoning_effort === "low"
                          ? "text-accent-foreground"
                          : "text-muted-foreground/65",
                      )}
                      onSelect={() => handleReasoningEffortSelect("low")}
                      onClick={() => setReasoningEffortMenuOpen(false)}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 font-bold">
                          {t.inputBox.reasoningEffortLow}
                        </div>
                        <div className="pl-2 text-xs">
                          {t.inputBox.reasoningEffortLowDescription}
                        </div>
                      </div>
                      {context.reasoning_effort === "low" ? (
                        <CheckIcon className="ml-auto size-4" />
                      ) : (
                        <div className="ml-auto size-4" />
                      )}
                    </PromptInputActionMenuItem>
                    <PromptInputActionMenuItem
                      className={cn(
                        context.reasoning_effort === "medium" ||
                          !context.reasoning_effort
                          ? "text-accent-foreground"
                          : "text-muted-foreground/65",
                      )}
                      onSelect={() => handleReasoningEffortSelect("medium")}
                      onClick={() => setReasoningEffortMenuOpen(false)}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 font-bold">
                          {t.inputBox.reasoningEffortMedium}
                        </div>
                        <div className="pl-2 text-xs">
                          {t.inputBox.reasoningEffortMediumDescription}
                        </div>
                      </div>
                      {context.reasoning_effort === "medium" ||
                      !context.reasoning_effort ? (
                        <CheckIcon className="ml-auto size-4" />
                      ) : (
                        <div className="ml-auto size-4" />
                      )}
                    </PromptInputActionMenuItem>
                    <PromptInputActionMenuItem
                      className={cn(
                        context.reasoning_effort === "high"
                          ? "text-accent-foreground"
                          : "text-muted-foreground/65",
                      )}
                      onSelect={() => handleReasoningEffortSelect("high")}
                      onClick={() => setReasoningEffortMenuOpen(false)}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1 font-bold">
                          {t.inputBox.reasoningEffortHigh}
                        </div>
                        <div className="pl-2 text-xs">
                          {t.inputBox.reasoningEffortHighDescription}
                        </div>
                      </div>
                      {context.reasoning_effort === "high" ? (
                        <CheckIcon className="ml-auto size-4" />
                      ) : (
                        <div className="ml-auto size-4" />
                      )}
                    </PromptInputActionMenuItem>
                  </DropdownMenuGroup>
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            )}
              </>
            ) : null}
          </PromptInputTools>
          <PromptInputTools>
            {!attachmentsOnlyToolbar ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex border-0 bg-transparent p-0 shadow-none"
                  render={
                    <PromptInputButton
                      disabled={
                        disabled || !canUseAuthFeatures || models.length === 0
                      }
                    >
                      <div className="flex min-w-0 flex-col items-start text-left">
                        <ModelSelectorName className="text-xs font-normal">
                          {selectedModel?.display_name}
                        </ModelSelectorName>
                        {selectedModel?.model && (
                          <span className="text-muted-foreground w-full truncate text-[10px] leading-none">
                            {selectedModel.model}
                          </span>
                        )}
                      </div>
                    </PromptInputButton>
                  }
                />
                <DropdownMenuContent align="start" className="w-72">
                  {models.map((m) => (
                    <DropdownMenuItem
                      key={m.name}
                      onClick={() => handleModelSelect(m.name)}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <ModelSelectorName className="text-sm">
                          {m.display_name}
                        </ModelSelectorName>
                        {m.model && (
                          <span className="text-muted-foreground truncate text-sm">
                            {m.model}
                          </span>
                        )}
                      </div>
                      {m.name === context.model_name ? (
                        <CheckIcon className="ml-auto size-4" />
                      ) : (
                        <div className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <PromptInputSubmit
              className={cn(
                "rounded-full",
                submitLabel &&
                  "h-9 px-4 text-sm font-medium [&>svg]:size-3.5",
              )}
              disabled={submitDisabled}
              size={submitLabel ? "sm" : "icon-sm"}
              variant="outline"
              status={status}
            >
              {submitLabel ? (
                <>
                  <SendIcon className="size-3.5" />
                  <span>{submitLabel}</span>
                </>
              ) : undefined}
            </PromptInputSubmit>
          </PromptInputTools>
        </PromptInputFooter>
        {/*
          建议按钮区暂时停用，先保留原实现以便后续恢复。
          {isNewThread && searchParams.get("mode") !== "skill" && (
            <div className="absolute right-0 -bottom-20 left-0 z-0 flex items-center justify-center">
              <SuggestionList />
            </div>
          )}
        */}
        {!isNewThread && (
          <div className="bg-background absolute right-0 -bottom-[17px] left-0 z-0 h-4"></div>
        )}
      </PromptInput>

      {/*
        旧的追问建议展示区与确认弹窗暂时停用。
        {!disabled &&
          !isNewThread &&
          !followupsHidden &&
          (followupsLoading || followups.length > 0) && (
            <div></div>
          )}

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.inputBox.followupConfirmTitle}</DialogTitle>
              <DialogDescription>
                {t.inputBox.followupConfirmDescription}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button variant="secondary" onClick={confirmAppendAndSend}>
                {t.inputBox.followupConfirmAppend}
              </Button>
              <Button onClick={confirmReplaceAndSend}>
                {t.inputBox.followupConfirmReplace}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      */}
    </div>
  );
}

/*
function SuggestionList() {
  const { t } = useI18n();
  const { textInput } = usePromptInputController();
  const handleSuggestionClick = useCallback(
    (prompt: string | undefined) => {
      if (!prompt) return;
      textInput.setInput(prompt);
      setTimeout(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>(
          "textarea[name='message']",
        );
        if (textarea) {
          const selStart = prompt.indexOf("[");
          const selEnd = prompt.indexOf("]");
          if (selStart !== -1 && selEnd !== -1) {
            textarea.setSelectionRange(selStart, selEnd + 1);
            textarea.focus();
          }
        }
      }, 500);
    },
    [textInput],
  );
  return (
    <Suggestions className="min-h-16 w-fit items-start">
      <ConfettiButton
        className="text-muted-foreground cursor-pointer rounded-full px-4 text-xs font-normal dark:border-border dark:bg-card dark:hover:bg-muted dark:aria-expanded:bg-muted"
        variant="outline"
        size="sm"
        onClick={() => handleSuggestionClick(t.inputBox.surpriseMePrompt)}
      >
        <SparklesIcon className="size-4" /> {t.inputBox.surpriseMe}
      </ConfettiButton>
      {t.inputBox.suggestions.map((suggestion) => (
        <Suggestion
          key={suggestion.suggestion}
          icon={suggestion.icon}
          suggestion={suggestion.suggestion}
          onClick={() => handleSuggestionClick(suggestion.prompt)}
        />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex border-0 bg-transparent p-0 shadow-none"
          render={<Suggestion icon={PlusIcon} suggestion={t.common.create} />}
        />
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            {t.inputBox.suggestionsCreate.map((suggestion, index) =>
              "type" in suggestion && suggestion.type === "separator" ? (
                <DropdownMenuSeparator key={index} />
              ) : (
                !("type" in suggestion) && (
                  <DropdownMenuItem
                    key={suggestion.suggestion}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                  >
                    {suggestion.icon && <suggestion.icon className="size-4" />}
                    {suggestion.suggestion}
                  </DropdownMenuItem>
                )
              ),
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Suggestions>
  );
}
*/

function AddAttachmentsButton({
  className,
  disabled = false,
  label,
}: {
  className?: string;
  disabled?: boolean;
  label?: string;
}) {
  const { t } = useI18n();
  const attachments = usePromptInputAttachments();
  return (
    <Tooltip content={t.inputBox.addAttachments}>
      <PromptInputButton
        className={cn("px-2!", disabled && "cursor-not-allowed opacity-40", className)}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          attachments.openFileDialog();
        }}
      >
        <PaperclipIcon className="size-3" />
        {label ? <span className="text-xs font-normal">{label}</span> : null}
      </PromptInputButton>
    </Tooltip>
  );
}
