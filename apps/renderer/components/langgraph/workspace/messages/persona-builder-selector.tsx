"use client";

import type { BaseStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useEffect, useMemo, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPersonaBuilderClarificationArgs,
  type PersonaBuilderClarificationArgs,
} from "@/lib/langgraph/core/messages/utils";
import { cn } from "@/lib/utils";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { textOfMessage } from "@/lib/langgraph/core/threads/utils";

import type { AgentThreadState } from "@/lib/langgraph/core/threads";
import type { AgentThreadContext } from "@/lib/langgraph/core/threads";

type PersonaBuilderQuestion = {
  index: number;
  question: string;
};

type PersonaBuilderToolQuestion = {
  question?: unknown;
};

type PersonaBuilderSelection = {
  qa: Record<string, string>;
};

type PersonaBuilderSelectorProps = {
  thread: BaseStream<AgentThreadState>;
  threadId: string;
  isLoading?: boolean;
  clarificationMessage: Message;
};

const MARKER_START = "[NEED_HELP_SELECTION]";
const MARKER_END = "[/NEED_HELP_SELECTION]";

function normalizeForMatch(s: string) {
  return s
    // Strict matching with minimal normalization only:
    // trim leading/trailing spaces and drop trailing separator.
    .replace(/[：:]\s*$/g, "")
    .trim();
}

function parseQuestionsFromToolArgs(
  args: PersonaBuilderClarificationArgs,
): PersonaBuilderQuestion[] {
  if (!Array.isArray(args.questions)) return [];

  const parsed = (args.questions as PersonaBuilderToolQuestion[])
    .map((item, idx) => {
      const question =
        typeof item?.question === "string" ? item.question.trim() : "";
      if (!question) return null;

      return {
        index: idx,
        question,
      } satisfies PersonaBuilderQuestion;
    })
    .filter((q): q is PersonaBuilderQuestion => !!q);

  return parsed;
}

function parseSelectionMarkerFromThreadText(
  threadMessagesText: string,
): PersonaBuilderSelection | null {
  function splitQuestionAnswerLine(
    line: string,
  ): { question: string; answer: string } | null {
    const raw = line.replace(/^- /, "").trim();
    if (!raw) return null;

    // Use the LAST separator because question text itself may contain `：` (e.g. examples).
    const sepIdxCN = raw.lastIndexOf("：");
    const sepIdxEN = raw.lastIndexOf(":");
    const sepIdx = Math.max(sepIdxCN, sepIdxEN);
    if (sepIdx <= 0 || sepIdx >= raw.length - 1) return null;

    const question = raw.slice(0, sepIdx).trim();
    const answer = raw.slice(sepIdx + 1).trim();
    if (!question || !answer) return null;
    return { question, answer };
  }

  const start = threadMessagesText.indexOf(MARKER_START);
  if (start === -1) return null;
  const end = threadMessagesText.indexOf(MARKER_END, start);
  if (end === -1) return null;
  const block = threadMessagesText
    .slice(start + MARKER_START.length, end)
    .trim();
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out: PersonaBuilderSelection = { qa: {} };
  for (const line of lines) {
    // persona_builder marker intentionally omits `补充说明` line.
    const pair = splitQuestionAnswerLine(line);
    if (!pair) continue;
    const q = normalizeForMatch(pair.question);
    const a = pair.answer;
    if (!q || !a) continue;
    out.qa[q] = a;
  }
  return out;
}

function buildMarkerText(params: {
  qa: Array<{ question: string; answer: string }>;
}) {
  const lines = [
    MARKER_START,
    ...params.qa
      .filter((x) => x.answer.trim().length > 0)
      .map(({ question, answer }) => `${question}：${answer.trim()}`),
    MARKER_END,
  ];

  return lines.join("\n");
}

function resolveDefaultAnswers(
  questions: PersonaBuilderQuestion[],
  marker: PersonaBuilderSelection | null,
): Record<number, string> {
  if (!marker) return {};

  return questions.reduce<Record<number, string>>((acc, q) => {
    const key = normalizeForMatch(q.question);
    const desired = marker.qa[key];
    if (desired) acc[q.index] = desired;
    return acc;
  }, {});
}

function getFollowupAfterClarification(
  messages: Message[],
  clarificationMessageId: string,
): { locked: boolean; marker: PersonaBuilderSelection | null } {
  const idx = messages.findIndex((m) => m.id === clarificationMessageId);
  if (idx === -1) return { locked: false, marker: null };

  let locked = false;
  let marker: PersonaBuilderSelection | null = null;

  for (let i = idx + 1; i < messages.length; i++) {
    const m = messages[i]!;
    if (m.type !== "human") continue;
    locked = true;
    const txt = textOfMessage(m);
    if (!marker && txt) {
      const parsed = parseSelectionMarkerFromThreadText(txt);
      if (parsed) {
        marker = parsed;
      }
    }
  }

  return { locked, marker };
}

export function PersonaBuilderSelector({
  thread,
  threadId,
  clarificationMessage,
}: PersonaBuilderSelectorProps) {
  const { context: localContext } = useLocalSettings()[0];

  const toolArgs = useMemo(() => {
    return getPersonaBuilderClarificationArgs(clarificationMessage);
  }, [clarificationMessage]);

  const questions = useMemo(() => {
    return toolArgs ? parseQuestionsFromToolArgs(toolArgs) : [];
  }, [toolArgs]);

  const followup = useMemo(() => {
    return getFollowupAfterClarification(
      thread.messages ?? [],
      clarificationMessage.id ?? "",
    );
  }, [thread.messages, clarificationMessage.id]);

  const resolvedAnswers = useMemo(() => {
    return resolveDefaultAnswers(questions, followup.marker);
  }, [questions, followup.marker]);

  const [answersByQuestionIndex, setAnswersByQuestionIndex] = useState<
    Record<number, string>
  >(resolvedAnswers);
  const [submitting, setSubmitting] = useState(false);

  const markerKey = useMemo(() => {
    const m = followup.marker;
    if (!m) return null;
    const qa = m.qa ?? {};
    const sortedKeys = Object.keys(qa).sort();
    const qaPart = sortedKeys.map((k) => `${k}:${qa[k]}`).join("|");
    return qaPart;
  }, [followup.marker]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (markerKey === null) return;

    const next = resolvedAnswers;
    const nextEmpty = Object.keys(next).length === 0;

    // Keep last non-empty answers when locked to avoid flicker.
    if (followup.locked && nextEmpty) {
      setAnswersByQuestionIndex((prev) => prev);
      return;
    }

    setAnswersByQuestionIndex(next);
    // Intentionally only depend on `markerKey`.
  }, [markerKey, questions.length]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const v = answersByQuestionIndex[q.index];
      return typeof v === "string" && v.trim().length > 0;
    }).length;
  }, [questions, answersByQuestionIndex]);

  const handleContinue = async () => {
    if (submitting) return;
    if (followup.locked) return;
    if (answeredCount <= 0) return;

    setSubmitting(true);
    try {
      const qa = questions
        .map((q) => ({
          question: q.question,
          answer: answersByQuestionIndex[q.index] ?? "",
        }))
        .filter((x) => x.answer.trim().length > 0);

      const markerText = buildMarkerText({ qa });

      const agentContext = {
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

      await thread.submit(
        {
          messages: [
            {
              type: "human",
              content: [{ type: "text", text: markerText }],
            },
          ],
        },
        {
          threadId,
          streamSubgraphs: true,
          streamResumable: true,
          config: { recursion_limit: 1000 },
          context: agentContext,
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) return null;

  return (
    <div className="w-full">
      <div className="space-y-4">
        {questions.map((q) => {
          const value = answersByQuestionIndex[q.index] ?? "";
          return (
            <div
              key={q.index}
              className="rounded-xl border border-border/60 bg-transparent p-4"
            >
              <div className="mb-3 text-base font-medium text-foreground">
                {q.question}
              </div>

              <Input
                value={value}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setAnswersByQuestionIndex((prev) => ({
                    ...prev,
                    [q.index]: nextVal,
                  }));
                }}
                className={cn(
                  "h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-[15px] placeholder:text-[15px] outline-none focus:border-primary",
                  (submitting || followup.locked) && "disabled:opacity-70",
                )}
                disabled={submitting || followup.locked}
              />
            </div>
          );
        })}
      </div>

      {!followup.locked && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={submitting || answeredCount <= 0}
            size="lg"
            className="relative px-7 text-[15px] font-medium shadow-sm transition-[transform,box-shadow] hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:transform-none disabled:shadow-none"
          >
            <span className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-r from-primary to-violet-500 opacity-90" />
            <span className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-r from-primary/50 to-violet-500/50 opacity-0 blur-md transition-opacity group-hover/button:opacity-60" />
            <span className="relative inline-flex items-center gap-2 whitespace-nowrap">
              {submitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  继续中
                </>
              ) : (
                "继续"
              )}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
