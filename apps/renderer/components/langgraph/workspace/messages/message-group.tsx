import type { Message } from "@langchain/langgraph-sdk";
import {
  BookOpenTextIcon,
  ChevronUp,
  FolderOpenIcon,
  GlobeIcon,
  ImageIcon,
  ImageOffIcon,
  LightbulbIcon,
  ListTodoIcon,
  MessageCircleQuestionMarkIcon,
  NotebookPenIcon,
  SearchIcon,
  SquareTerminalIcon,
  WrenchIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/langgraph/ai-elements/chain-of-thought";
import { CodeBlock } from "@/components/langgraph/ai-elements/code-block";
import { Button } from "@/components/ui/button";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import {
  extractContentFromMessage,
  extractReasoningContentFromMessage,
  findToolCallResult,
} from "@/lib/langgraph/core/messages/utils";
import { useRehypeSplitWordsIntoSpans } from "@/lib/langgraph/core/rehype";
import { extractTitleFromMarkdown } from "@/lib/langgraph/core/utils/markdown";
import { cn } from "@/lib/utils";
import { getGenImageUrl } from "@/lib/utils";
import Image from "next/image";

import { useArtifacts } from "../artifacts";
import { FlipDisplay } from "../flip-display";
import { Tooltip } from "../tooltip";

import { MarkdownContent } from "./markdown-content";

type GenerateImageArtifact = {
  index?: number;
  artifact_url?: string;
  status?: string;
  filename?: string;
  error?: string;
};

function isGenerateImageArtifactFailed(
  item: GenerateImageArtifact | undefined,
): boolean {
  if (!item) return false;
  const st = item.status?.toLowerCase();
  if (st === "failed" || st === "error") return true;
  if (typeof item.error === "string" && item.error.trim().length > 0) return true;
  return false;
}

type ToolMessageWithArtifact = Message & {
  type: "tool";
  name?: string;
  tool_call_id?: string;
  artifact?: unknown;
  status?: string;
};

export function MessageGroup({
  className,
  messages,
  isLoading = false,
}: {
  className?: string;
  messages: Message[];
  isLoading?: boolean;
}) {
  const { t } = useI18n();
  const [showAbove, setShowAbove] = useState(false);
  const [showLastThinking, setShowLastThinking] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const steps = useMemo(() => convertToSteps(messages), [messages]);
  const lastToolCallStep = useMemo(() => {
    const filteredSteps = steps.filter((step) => step.type === "toolCall");
    return filteredSteps[filteredSteps.length - 1];
  }, [steps]);
  const aboveLastToolCallSteps = useMemo(() => {
    if (lastToolCallStep) {
      const index = steps.indexOf(lastToolCallStep);
      return steps.slice(0, index);
    }
    return [];
  }, [lastToolCallStep, steps]);
  const lastReasoningStep = useMemo(() => {
    if (lastToolCallStep) {
      const index = steps.indexOf(lastToolCallStep);
      return steps.slice(index + 1).find((step) => step.type === "reasoning");
    } else {
      const filteredSteps = steps.filter((step) => step.type === "reasoning");
      return filteredSteps[filteredSteps.length - 1];
    }
  }, [lastToolCallStep, steps]);
  const rehypePlugins = useRehypeSplitWordsIntoSpans(isLoading);

  /** Every generate_images tool call in this group (chronological), not only the last one. */
  const generateImagesBatches = useMemo(() => {
    const batches: Array<{
      key: string;
      count: number;
      content: string;
      artifact: unknown;
      toolStatus?: string;
    }> = [];

    for (const m of messages) {
      if (m.type !== "ai" || !Array.isArray(m.tool_calls)) continue;
      const mid = String(m.id ?? "");
      let firstGenerateImagesInMessage = true;
      const msgContent = extractContentFromMessage(m) || "";

      for (const tc of m.tool_calls) {
        if (tc?.name !== "generate_images") continue;
        const count = Array.isArray(tc.args?.images) ? tc.args.images.length : 0;
        if (count <= 0) continue;

        const toolCallId = tc.id as string | undefined;
        const toolMsg = toolCallId
          ? (messages.find((x) => {
              const toolMessage = x as ToolMessageWithArtifact;
              return (
                toolMessage?.type === "tool" &&
                toolMessage?.name === "generate_images" &&
                toolMessage?.tool_call_id === toolCallId
              );
            }) as ToolMessageWithArtifact | undefined)
          : undefined;

        batches.push({
          key: toolCallId ?? `${mid}-gen-${batches.length}`,
          count,
          content: firstGenerateImagesInMessage ? msgContent : "",
          artifact: toolMsg?.artifact,
          toolStatus:
            typeof toolMsg?.status === "string"
              ? toolMsg.status.toLowerCase()
              : undefined,
        });
        firstGenerateImagesInMessage = false;
      }
    }

    return batches;
  }, [messages]);

  return (
    <div className={cn("w-full", className)}>
      <ChainOfThought
        className="w-full gap-2 rounded-lg border p-0.5"
        open={true}
      >
        {aboveLastToolCallSteps.length > 0 && (
          <Button
            key="above"
            className="w-full items-start justify-start text-left"
            variant="ghost"
            onClick={() => setShowAbove(!showAbove)}
          >
            <ChainOfThoughtStep
              label={
                <span className="opacity-60">
                  {showAbove
                    ? t.toolCalls.lessSteps
                    : t.toolCalls.moreSteps(aboveLastToolCallSteps.length)}
                </span>
              }
              icon={
                <ChevronUp
                  className={cn(
                    "size-4 opacity-60 transition-transform duration-200",
                    showAbove ? "rotate-180" : "",
                  )}
                />
              }
            ></ChainOfThoughtStep>
          </Button>
        )}
        {lastToolCallStep && (
          <ChainOfThoughtContent className="px-4 pb-2">
            {showAbove &&
              aboveLastToolCallSteps.map((step) =>
                step.type === "reasoning" ? (
                  <ChainOfThoughtStep
                    key={step.id}
                    label={
                      <MarkdownContent
                        content={step.reasoning ?? ""}
                        isLoading={isLoading}
                        rehypePlugins={rehypePlugins}
                      />
                    }
                  ></ChainOfThoughtStep>
                ) : (
                  <ToolCall key={step.id} {...step} isLoading={isLoading} />
                ),
              )}
            {lastToolCallStep && (
              <FlipDisplay uniqueKey={lastToolCallStep.id ?? ""}>
                <ToolCall
                  key={lastToolCallStep.id}
                  {...lastToolCallStep}
                  isLast={true}
                  isLoading={isLoading}
                />
              </FlipDisplay>
            )}
          </ChainOfThoughtContent>
        )}
        {lastReasoningStep && (
          <>
            <Button
              key={lastReasoningStep.id}
              className="w-full items-start justify-start text-left"
              variant="ghost"
              onClick={() => setShowLastThinking(!showLastThinking)}
            >
              <div className="flex w-full items-center justify-between">
                <ChainOfThoughtStep
                  className="font-normal"
                  label={t.common.thinking}
                  icon={LightbulbIcon}
                ></ChainOfThoughtStep>
                <div>
                  <ChevronUp
                    className={cn(
                      "text-muted-foreground size-4",
                      showLastThinking ? "" : "rotate-180",
                    )}
                  />
                </div>
              </div>
            </Button>
            {showLastThinking && (
              <ChainOfThoughtContent className="px-4 pb-2">
                <ChainOfThoughtStep
                  key={lastReasoningStep.id}
                  label={
                    <MarkdownContent
                      content={lastReasoningStep.reasoning ?? ""}
                      isLoading={isLoading}
                      rehypePlugins={rehypePlugins}
                    />
                  }
                ></ChainOfThoughtStep>
              </ChainOfThoughtContent>
            )}
          </>
        )}
      </ChainOfThought>

      {generateImagesBatches.length > 0 && (
        <div className="mt-8 space-y-6">
          {generateImagesBatches.map((batch) => (
            <div key={batch.key}>
              {batch.content ? (
                <MarkdownContent
                  content={batch.content}
                  isLoading={isLoading}
                  rehypePlugins={rehypePlugins}
                  className="mb-2"
                />
              ) : null}

              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: batch.count }).map((_, idx) => {
                  const artifacts = Array.isArray(batch.artifact)
                    ? (batch.artifact as GenerateImageArtifact[])
                    : [];
                  const item = artifacts.find((a) => a?.index === idx);
                  const src = item?.artifact_url ? getGenImageUrl(item.artifact_url) : "";
                  const completed = item?.status === "completed" && !!src;
                  // 整个 generate_images tool 调用报错（artifact 为空）时，所有占位都应立即转为失败态
                  const batchFailed = batch.toolStatus === "error";
                  const failed = batchFailed || isGenerateImageArtifactFailed(item);
                  const failedBody = (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-destructive/5 px-2 text-center">
                      <ImageOffIcon
                        className="size-8 shrink-0 text-destructive/75"
                        aria-hidden
                      />
                      <span className="line-clamp-2 text-xs font-medium text-destructive/90">
                        {t.toolCalls.imageGenerationFailed}
                      </span>
                    </div>
                  );
                  return (
                    <div
                      key={`${batch.key}-${idx}`}
                      className="relative overflow-hidden rounded-lg border border-border/40 bg-muted/20"
                    >
                      <div className="aspect-square w-full">
                        {completed ? (
                          <button
                            type="button"
                            className="h-full w-full cursor-zoom-in"
                            onClick={() =>
                              setPreviewImage({
                                src,
                                alt: item?.filename ?? `image-${idx}`,
                              })
                            }
                            aria-label="预览图片"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={item?.filename ?? `image-${idx}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ) : failed ? (
                          failedBody
                        ) : (
                          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-muted/85 via-muted/50 to-muted/75">
                            <motion.div
                              className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-primary/20 blur-2xl"
                              animate={{
                                x: [0, 18, 0],
                                y: [0, 14, 0],
                                opacity: [0.28, 0.68, 0.28],
                              }}
                              transition={{
                                duration: 1.8,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                              }}
                            />
                            <motion.div
                              className="pointer-events-none absolute -right-12 -bottom-12 size-36 rounded-full bg-foreground/15 blur-2xl"
                              animate={{
                                x: [0, -14, 0],
                                y: [0, -16, 0],
                                opacity: [0.18, 0.44, 0.18],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div
                                className="absolute size-12 rounded-full border border-foreground/35"
                                animate={{
                                  scale: [0.85, 1.45],
                                  opacity: [0.45, 0],
                                }}
                                transition={{
                                  duration: 1.25,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "easeOut",
                                }}
                              />
                              <motion.div
                                animate={{
                                  y: [0, -3, 0],
                                  scale: [0.96, 1.1, 0.96],
                                  opacity: [0.4, 0.5, 0.4],
                                }}
                                transition={{
                                  duration: 1.1,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "easeInOut",
                                }}
                              >
                                <ImageIcon className="size-9 text-foreground/70" />
                              </motion.div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <ImagePreviewDialog
        open={Boolean(previewImage?.src?.trim())}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
        src={previewImage?.src?.trim() ?? ""}
        alt={previewImage?.alt ?? "preview-image"}
      />
    </div>
  );
}

function ToolCall({
  id,
  messageId,
  name,
  args,
  result,
  isLast = false,
  isLoading = false,
}: {
  id?: string;
  messageId?: string;
  name: string;
  args: Record<string, unknown>;
  result?: string | Record<string, unknown>;
  isLast?: boolean;
  isLoading?: boolean;
}) {
  const { t } = useI18n();
  const { setOpen, autoOpen, autoSelect, selectedArtifact, select } =
    useArtifacts();

  if (name === "web_search") {
    let label: React.ReactNode = t.toolCalls.searchForRelatedInfo;
    if (typeof args.query === "string") {
      label = t.toolCalls.searchOnWebFor(args.query);
    }
    return (
      <ChainOfThoughtStep key={id} label={label} icon={SearchIcon}>
        {Array.isArray(result) && (
          <ChainOfThoughtSearchResults>
            {result.map((item) => (
              <ChainOfThoughtSearchResult key={item.url}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
              </ChainOfThoughtSearchResult>
            ))}
          </ChainOfThoughtSearchResults>
        )}
      </ChainOfThoughtStep>
    );
  } else if (name === "image_search") {
    let label: React.ReactNode = t.toolCalls.searchForRelatedImages;
    if (typeof args.query === "string") {
      label = t.toolCalls.searchForRelatedImagesFor(args.query);
    }
    const results = (
      result as {
        results: {
          source_url: string;
          thumbnail_url: string;
          image_url: string;
          title: string;
        }[];
      }
    )?.results;
    return (
      <ChainOfThoughtStep key={id} label={label} icon={SearchIcon}>
        {Array.isArray(results) && (
          <ChainOfThoughtSearchResults>
            {Array.isArray(results) &&
              results.map((item) => (
                <Tooltip key={item.image_url} content={item.title}>
                  <a
                    className="size-24 overflow-hidden rounded-lg object-cover"
                    href={item.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="bg-accent size-24">
                      <Image
                        className="size-full object-cover"
                        src={item.thumbnail_url}
                        alt={item.title}
                        width={100}
                        height={100}
                        unoptimized
                      />
                    </div>
                  </a>
                </Tooltip>
              ))}
          </ChainOfThoughtSearchResults>
        )}
      </ChainOfThoughtStep>
    );
  } else if (name === "web_fetch") {
    const url = (args as { url: string })?.url;
    let title = url;
    if (typeof result === "string") {
      const potentialTitle = extractTitleFromMarkdown(result);
      if (potentialTitle && potentialTitle.toLowerCase() !== "untitled") {
        title = potentialTitle;
      }
    }
    return (
      <ChainOfThoughtStep
        key={id}
        className="cursor-pointer"
        label={t.toolCalls.viewWebPage}
        icon={GlobeIcon}
        onClick={() => {
          window.open(url, "_blank");
        }}
      >
        <ChainOfThoughtSearchResult>
          {url && (
            <a href={url} target="_blank" rel="noreferrer">
              {title}
            </a>
          )}
        </ChainOfThoughtSearchResult>
      </ChainOfThoughtStep>
    );
  } else if (name === "ls") {
    let description: string | undefined = (args as { description: string })
      ?.description;
    if (!description) {
      description = t.toolCalls.listFolder;
    }
    const path: string | undefined = (args as { path: string })?.path;
    return (
      <ChainOfThoughtStep key={id} label={description} icon={FolderOpenIcon}>
        {path && (
          <ChainOfThoughtSearchResult className="cursor-pointer">
            {path}
          </ChainOfThoughtSearchResult>
        )}
      </ChainOfThoughtStep>
    );
  } else if (name === "read_file") {
    let description: string | undefined = (args as { description: string })
      ?.description;
    if (!description) {
      description = t.toolCalls.readFile;
    }
    const { path } = args as { path: string; content: string };
    return (
      <ChainOfThoughtStep key={id} label={description} icon={BookOpenTextIcon}>
        {path && (
          <ChainOfThoughtSearchResult className="cursor-pointer">
            {path}
          </ChainOfThoughtSearchResult>
        )}
      </ChainOfThoughtStep>
    );
  } else if (name === "write_file" || name === "str_replace") {
    let description: string | undefined = (args as { description: string })
      ?.description;
    if (!description) {
      description = t.toolCalls.writeFile;
    }
    const path: string | undefined = (args as { path: string })?.path;
    if (isLoading && isLast && autoOpen && autoSelect && path && !result) {
      setTimeout(() => {
        const url = new URL(
          `write-file:${path}?message_id=${messageId}&tool_call_id=${id}`,
        ).toString();
        if (selectedArtifact === url) {
          return;
        }
        select(url, true);
        setOpen(true);
      }, 100);
    }

    return (
      <ChainOfThoughtStep
        key={id}
        className="cursor-pointer"
        label={description}
        icon={NotebookPenIcon}
        onClick={() => {
          select(
            new URL(
              `write-file:${path}?message_id=${messageId}&tool_call_id=${id}`,
            ).toString(),
          );
          setOpen(true);
        }}
      >
        {path && (
          <ChainOfThoughtSearchResult className="cursor-pointer">
            {path}
          </ChainOfThoughtSearchResult>
        )}
      </ChainOfThoughtStep>
    );
  } else if (name === "bash") {
    const description: string | undefined = (args as { description: string })
      ?.description;
    if (!description) {
      return t.toolCalls.executeCommand;
    }
    const command: string | undefined = (args as { command: string })?.command;
    return (
      <ChainOfThoughtStep
        key={id}
        label={description}
        icon={SquareTerminalIcon}
      >
        {command && (
          <CodeBlock
            className="mx-0 cursor-pointer border-none px-0"
            showLineNumbers={false}
            language="bash"
            code={command}
          />
        )}
      </ChainOfThoughtStep>
    );
  } else if (name === "ask_clarification") {
    return (
      <ChainOfThoughtStep
        key={id}
        label={t.toolCalls.needYourHelp}
        icon={MessageCircleQuestionMarkIcon}
      ></ChainOfThoughtStep>
    );
  } else if (name === "write_todos") {
    return (
      <ChainOfThoughtStep
        key={id}
        label={t.toolCalls.writeTodos}
        icon={ListTodoIcon}
      ></ChainOfThoughtStep>
    );
  } else {
    const description: string | undefined = (args as { description: string })
      ?.description;
    return (
      <ChainOfThoughtStep
        key={id}
        label={description ?? t.toolCalls.useTool(name)}
        icon={WrenchIcon}
      ></ChainOfThoughtStep>
    );
  }
}

interface GenericCoTStep<T extends string = string> {
  id?: string;
  messageId?: string;
  type: T;
}

interface CoTReasoningStep extends GenericCoTStep<"reasoning"> {
  reasoning: string | null;
}

interface CoTToolCallStep extends GenericCoTStep<"toolCall"> {
  name: string;
  args: Record<string, unknown>;
  result?: string;
  content?: string;
  artifact?: unknown;
}

type CoTStep = CoTReasoningStep | CoTToolCallStep;

function convertToSteps(messages: Message[]): CoTStep[] {
  const steps: CoTStep[] = [];
  for (const message of messages) {
    if (message.type === "ai") {
      const reasoning = extractReasoningContentFromMessage(message);
      if (reasoning) {
        const step: CoTReasoningStep = {
          id: message.id,
          messageId: message.id,
          type: "reasoning",
          reasoning: extractReasoningContentFromMessage(message),
        };
        steps.push(step);
      }
      for (const tool_call of message.tool_calls ?? []) {
        if (tool_call.name === "task") {
          continue;
        }
        const step: CoTToolCallStep = {
          id: tool_call.id,
          messageId: message.id,
          type: "toolCall",
          name: tool_call.name,
          args: tool_call.args,
          content: extractContentFromMessage(message) || undefined,
        };
        const toolCallId = tool_call.id;
        if (toolCallId) {
          const toolMsg = messages.find(
            (m) =>
              (m as ToolMessageWithArtifact)?.type === "tool" &&
              (m as ToolMessageWithArtifact)?.tool_call_id === toolCallId,
          ) as ToolMessageWithArtifact | undefined;
          if (toolMsg && "artifact" in toolMsg) {
            step.artifact = toolMsg.artifact;
          }
          const toolCallResult = findToolCallResult(toolCallId, messages);
          if (toolCallResult) {
            try {
              const json = JSON.parse(toolCallResult);
              step.result = json;
            } catch {
              step.result = toolCallResult;
            }
          }
        }
        steps.push(step);
      }
    }
  }
  return steps;
}
