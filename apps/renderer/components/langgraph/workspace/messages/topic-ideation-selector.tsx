"use client";

import * as React from "react";
import type { Message } from "@langchain/langgraph-sdk";
import type { BaseStream } from "@langchain/langgraph-sdk/react";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import {
  getTopicIdeationClarificationArgs,
  type TopicIdeationClarificationArgs,
  type TopicIdeationClarificationQuestion,
  type TopicIdeationClarificationSuggestion,
} from "@/lib/langgraph/core/messages/utils";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import type { AgentThreadContext, AgentThreadState } from "@/lib/langgraph/core/threads";
import { cn } from "@/lib/utils";

type TopicIdeationSelectorProps = {
  thread: BaseStream<AgentThreadState>;
  threadId: string;
  isLoading?: boolean;
  clarificationMessage: Message;
};

type IdeationSuggestion = {
  index: number;
  title: string;
  keywords: string[];
  reason?: string;
  value?: string;
};

type IdeationQuestion = {
  index: number;
  question: string;
  suggestions: IdeationSuggestion[];
};

function OverflowTooltipText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const textRef = React.useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  const measure = React.useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const overflowByHeight = el.scrollHeight > el.clientHeight + 1;
    const overflowByWidth = el.scrollWidth > el.clientWidth + 1;
    setIsOverflowing(overflowByHeight || overflowByWidth);
  }, []);

  React.useLayoutEffect(() => {
    measure();
    const el = textRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, text]);

  const element = (
    <p ref={textRef} className={className}>
      {text}
    </p>
  );

  if (!isOverflowing) {
    return element;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="block w-full min-w-0"
        render={
          <div className="block w-full min-w-0 cursor-default outline-none">{element}</div>
        }
      />
      <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap break-words text-left">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function parseTopicIdeationQuestions(
  args: TopicIdeationClarificationArgs,
): IdeationQuestion[] {
  if (!Array.isArray(args.questions)) return [];

  return (args.questions as TopicIdeationClarificationQuestion[]).flatMap(
    (question, questionIdx) => {
      const questionText =
        typeof question?.question === "string" ? question.question.trim() : "";
      if (!questionText) return [];

      const suggestions = Array.isArray(question?.suggestions)
        ? (question.suggestions as TopicIdeationClarificationSuggestion[]).flatMap(
            (suggestion, suggestionIdx) => {
              const title =
                typeof suggestion?.title === "string" ? suggestion.title.trim() : "";
              if (!title) return [];
              const keywords = Array.isArray(suggestion?.keywords)
                ? suggestion.keywords
                    .filter((keyword): keyword is string => typeof keyword === "string")
                    .map((keyword) => keyword.trim())
                    .filter((keyword) => keyword.length > 0)
                : [];
              return [
                {
                  index: suggestionIdx,
                  title,
                  keywords,
                  reason:
                    typeof suggestion?.reason === "string"
                      ? suggestion.reason.trim()
                      : undefined,
                  value:
                    typeof suggestion?.value === "string"
                      ? suggestion.value.trim()
                      : undefined,
                } satisfies IdeationSuggestion,
              ];
            },
          )
        : [];

      return [
        {
          index: questionIdx,
          question: questionText,
          suggestions,
        } satisfies IdeationQuestion,
      ];
    },
  );
}

function TopicIdeationSuggestionCard({
  thread,
  threadId,
  isLoading,
  suggestion,
}: {
  thread: BaseStream<AgentThreadState>;
  threadId: string;
  isLoading?: boolean;
  suggestion: IdeationSuggestion;
}) {
  const { t } = useI18n();
  const tTopicCenter = useTranslations("topicCenter");
  const { context: localContext } = useLocalSettings()[0];
  const [creationMenuOpen, setCreationMenuOpen] = React.useState(false);
  const [submittingContinue, setSubmittingContinue] = React.useState(false);
  const [submittingCreation, setSubmittingCreation] = React.useState(false);

  const buildAgentContext = React.useCallback((): AgentThreadContext => {
    return {
      ...localContext,
      thinking_enabled: localContext.mode !== "flash",
      is_plan_mode:
        localContext.mode === "pro" || localContext.mode === "ultra",
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

  const submitHumanMessage = React.useCallback(
    async (text: string) => {
      await thread.submit(
        {
          messages: [
            {
              type: "human",
              content: [{ type: "text", text }],
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
    },
    [thread, threadId, buildAgentContext],
  );

  const handleContinueIdeation = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (submittingContinue || submittingCreation || isLoading) return;
    const title = suggestion.title.trim();
    if (!title) return;

    setSubmittingContinue(true);
    try {
      const text = `${tTopicCenter("actions.divergePromptPrefix")}${title}`;
      await submitHumanMessage(text);
    } finally {
      setSubmittingContinue(false);
    }
  };

  const handleCreationMenuPick = async (
    event: React.MouseEvent,
    messageKey: "creationPromptXiaohongshu" | "creationPromptMediumLongArticle",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (submittingContinue || submittingCreation || isLoading) return;
    const title = suggestion.title.trim();
    if (!title) return;

    setSubmittingCreation(true);
    try {
      const text =
        messageKey === "creationPromptXiaohongshu"
          ? tTopicCenter("actions.creationPromptXiaohongshu", { title })
          : tTopicCenter("actions.creationPromptMediumLongArticle", { title });
      await submitHumanMessage(text);
      setCreationMenuOpen(false);
    } finally {
      setSubmittingCreation(false);
    }
  };

  return (
    <article
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border/60 bg-card/60 p-4",
        "transition-all hover:border-primary/40 hover:shadow-sm",
      )}
    >
      <div className="space-y-2">
        <OverflowTooltipText
          text={suggestion.title}
          className="truncate text-[14px] leading-6 font-semibold text-foreground"
        />
        {suggestion.reason ? (
          <OverflowTooltipText
            text={suggestion.reason}
            className="line-clamp-2 text-sm text-muted-foreground"
          />
        ) : null}
        {suggestion.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {suggestion.keywords.map((keyword, keywordIdx) => (
              <span
                key={`${suggestion.index}-${keyword}-${keywordIdx}`}
                className="inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-xs text-primary"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : (
          <div className="h-6" aria-hidden />
        )}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 rounded-b-xl",
          "bg-background/95 px-3 py-2 opacity-0 transition-opacity",
          "group-hover:pointer-events-auto group-hover:opacity-100",
          (creationMenuOpen || submittingContinue || submittingCreation) &&
            "pointer-events-auto opacity-100",
        )}
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="inline-flex h-8 items-center gap-1.5 px-3 text-xs"
          disabled={submittingContinue || submittingCreation}
          onClick={handleContinueIdeation}
        >
          {submittingContinue ? (
            <Loader2Icon className="size-3.5 shrink-0 animate-spin" aria-hidden />
          ) : null}
          {t.toolCalls.continueIdeation}
        </Button>
        <DropdownMenu open={creationMenuOpen} onOpenChange={setCreationMenuOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                size="sm"
                className="inline-flex h-8 items-center gap-1.5 px-3 text-xs"
                disabled={submittingContinue || submittingCreation}
                onClick={(event) => event.stopPropagation()}
              />
            }
          >
            {submittingCreation ? (
              <Loader2Icon className="size-3.5 shrink-0 animate-spin" aria-hidden />
            ) : null}
            {t.toolCalls.startCreation}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={6}
            className="min-w-[10rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem
              disabled={submittingContinue || submittingCreation}
              onClick={(event) => void handleCreationMenuPick(event, "creationPromptXiaohongshu")}
            >
              {t.toolCalls.createXiaohongshu}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={submittingContinue || submittingCreation}
              onClick={(event) =>
                void handleCreationMenuPick(event, "creationPromptMediumLongArticle")
              }
            >
              {t.toolCalls.createMediumLongArticle}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

export function TopicIdeationSelector({
  thread,
  threadId,
  isLoading,
  clarificationMessage,
}: TopicIdeationSelectorProps) {
  const clarificationArgs = getTopicIdeationClarificationArgs(clarificationMessage);
  const questions = clarificationArgs
    ? parseTopicIdeationQuestions(clarificationArgs)
    : [];

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {questions.map((question) => (
        <section key={question.index} className="space-y-3">
          <h4 className="text-base font-normal text-foreground">{question.question}</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {question.suggestions.map((suggestion) => (
              <TopicIdeationSuggestionCard
                key={`${question.index}-${suggestion.index}`}
                thread={thread}
                threadId={threadId}
                isLoading={isLoading}
                suggestion={suggestion}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
