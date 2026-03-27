"use client";

import type { BaseStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useEffect, useMemo, useState } from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { extractContentFromMessage } from "@/lib/langgraph/core/messages/utils";
import { textOfMessage } from "@/lib/langgraph/core/threads/utils";

import type { AgentThreadState } from "@/lib/langgraph/core/threads";
import type { AgentThreadContext } from "@/lib/langgraph/core/threads";
import type { MarkdownContentProps } from "./markdown-content";
import { MarkdownContent } from "./markdown-content";

type ClarificationQuestionOption = {
  index: number;
  text: string;
};

type ClarificationQuestion = {
  index: number;
  title: string;
  options: ClarificationQuestionOption[];
};

type ClarificationSelection = {
  // key: normalized question title
  qa: Record<string, string>; // selected option text
  supplement?: string;
};

type ClarificationSelectorProps = {
  thread: BaseStream<AgentThreadState>;
  threadId: string;
  isLoading?: boolean;
  clarificationMessage: Message;
  rehypePlugins: MarkdownContentProps["rehypePlugins"];
};

const MARKER_START = "[NEED_HELP_SELECTION]";
const MARKER_END = "[/NEED_HELP_SELECTION]";

function normalizeForMatch(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/[：:]\s*$/g, "")
    .trim();
}

function parseQuestionsFromClarificationText(text: string): ClarificationQuestion[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "•" && l !== "-" && l !== "*");

  const optionRe = /^\d+\.\s*(.+)$/;

  const questions: ClarificationQuestion[] = [];

  // Step 1: locate each contiguous option block (1./2./3./4. ...)
  let i = 0;
  while (i < lines.length) {
    const start = i;
    if (!optionRe.test(lines[i]!)) {
      i++;
      continue;
    }

    const opts: ClarificationQuestionOption[] = [];
    while (i < lines.length) {
      const m = optionRe.exec(lines[i]!);
      if (!m) break;
      opts.push({ index: opts.length, text: m[1].trim() });
      i++;
    }

    if (opts.length === 0) continue;

    // Step 2: find the nearest preceding non-option line as title
    let title = "";
    for (let k = start - 1; k >= 0; k--) {
      const candidate = lines[k]!;
      if (optionRe.test(candidate)) {
        // crossed into previous option block
        break;
      }
      const cleaned = candidate.replace(/^[•\-*]\s*/g, "").trim();
      if (!cleaned) continue;
      // Prefer the line that looks like a question; otherwise still accept the nearest line.
      title = cleaned;
      if (/[？?]$/.test(cleaned) || /这是|什么|是否|需要|希望/.test(cleaned)) {
        break;
      }
    }

    questions.push({
      index: questions.length,
      title: title || `问题 ${questions.length + 1}`,
      options: opts,
    });
  }

  return questions;
}

function extractPrefaceFromClarificationText(
  text: string,
  questions: ClarificationQuestion[],
): string {
  if (questions.length === 0) return text.trim();

  // Preface = everything before the first question title line.
  // We locate the first question title by searching it in the original text.
  const firstTitle = questions[0]?.title?.trim();
  if (!firstTitle) return "";

  const idx = text.indexOf(firstTitle);
  if (idx <= 0) return "";

  const preface = text
    .slice(0, idx)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    // drop standalone bullet markers that render as an empty dot
    .filter((l) => l !== "•" && l !== "-" && l !== "*" && l !== "·")
    .join("\n")
    .trim();
  return preface;
}
function parseSelectionMarkerFromThreadText(
  threadMessagesText: string,
): ClarificationSelection | null {
  const start = threadMessagesText.indexOf(MARKER_START);
  if (start === -1) return null;
  const end = threadMessagesText.indexOf(MARKER_END, start);
  if (end === -1) return null;

  const block = threadMessagesText.slice(start + MARKER_START.length, end).trim();
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out: ClarificationSelection = { qa: {} };
  for (const line of lines) {
    const supplementMatch = /^补充说明[:：]\s*(.+)$/.exec(line);
    if (supplementMatch) {
      out.supplement = supplementMatch[1]?.trim();
      continue;
    }

    // Pair line: <question>：<option>
    const pair = /^(?:- )?(.+?)[:：]\s*(.+)$/.exec(line);
    if (!pair) continue;
    const q = normalizeForMatch(pair[1] ?? "");
    const a = (pair[2] ?? "").trim();
    if (!q || !a) continue;
    out.qa[q] = a;
  }
  return out;
}

function buildMarkerText(params: {
  qa: Array<{ question: string; answer: string }>;
  supplement: string;
}) {
  const supplement = params.supplement?.trim()
    ? params.supplement.trim()
    : "无其他补充";

  const lines = [
    MARKER_START,
    ...params.qa.map(({ question, answer }) => `${question}：${answer}`),
    `补充说明：${supplement}`,
    MARKER_END,
  ];

  return lines.join("\n");
}

function resolveDefaultSelection(
  questions: ClarificationQuestion[],
  marker: ClarificationSelection | null,
): {
  selectedByQuestionIndex: Record<number, string>; // option text
  supplement: string;
} {
  if (!marker) {
    return {
      // Default: do NOT select anything
      selectedByQuestionIndex: {},
      supplement: "",
    };
  }

  return {
    selectedByQuestionIndex: questions.reduce<Record<number, string>>(
      (acc, q) => {
        const key = normalizeForMatch(q.title);
        const desired = marker.qa[key];
        if (desired) {
          const desiredNorm = normalizeForMatch(desired);
          const match = q.options.find(
            (o) => normalizeForMatch(o.text) === desiredNorm,
          );
          if (match) acc[q.index] = match.text;
        }
        return acc;
      },
      {},
    ),
    supplement:
      marker.supplement && marker.supplement !== "无其他补充"
        ? marker.supplement
        : "",
  };
}

export function ClarificationSelector({
  thread,
  threadId,
  isLoading,
  clarificationMessage,
  rehypePlugins,
}: ClarificationSelectorProps) {
  const { context: localContext } = useLocalSettings()[0];

  const markerForThisClarification = useMemo(() => {
    const messages = thread.messages ?? [];
    const idx = messages.findIndex((m) => m.id === clarificationMessage.id);
    if (idx === -1) return null;

    for (let i = idx + 1; i < messages.length; i++) {
      const m = messages[i]!;
      if (m.type !== "human") continue;
      const txt = textOfMessage(m);
      if (!txt || !txt.includes(MARKER_START)) continue;
      return parseSelectionMarkerFromThreadText(txt);
    }
    return null;
  }, [thread.messages, clarificationMessage.id]);

  const clarificationText = useMemo(() => {
    const raw = extractContentFromMessage(clarificationMessage);
    return raw ?? "";
  }, [clarificationMessage]);

  const questions = useMemo(() => {
    return parseQuestionsFromClarificationText(clarificationText);
  }, [clarificationText]);

  const preface = useMemo(() => {
    return extractPrefaceFromClarificationText(clarificationText, questions);
  }, [clarificationText, questions]);

  const resolved = useMemo(() => {
    return resolveDefaultSelection(questions, markerForThisClarification);
  }, [questions, markerForThisClarification]);

  const [selectedByQuestionIndex, setSelectedByQuestionIndex] = useState<
    Record<number, string>
  >(resolved.selectedByQuestionIndex);
  const [supplement, setSupplement] = useState<string>(resolved.supplement);
  const [submitting, setSubmitting] = useState(false);

  const isCompleted = !!markerForThisClarification;

  useEffect(() => {
    if (!markerForThisClarification) return;
    setSelectedByQuestionIndex(resolved.selectedByQuestionIndex);
    setSupplement(resolved.supplement);
  }, [markerForThisClarification, resolved.selectedByQuestionIndex, resolved.supplement]);

  const selectedCount = useMemo(() => {
    return questions.filter((q) => !!selectedByQuestionIndex[q.index]).length;
  }, [questions, selectedByQuestionIndex]);

  const handleContinue = async () => {
    if (submitting) return;
    if (isCompleted) return;
    if (selectedCount <= 0) return;
    setSubmitting(true);

    try {
      const qa = questions
        .map((q) => ({
          question: q.title,
          answer: selectedByQuestionIndex[q.index] ?? "",
        }))
        .filter((x) => x.answer.trim().length > 0);

      const markerText = buildMarkerText({
        qa,
        supplement: supplement.trim() ? supplement.trim() : "无其他补充",
      });

      const agentContext = {
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
      } as unknown as AgentThreadContext;

      // Submit marker as next human message
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

  if (questions.length === 0) {
    // Fallback: render original markdown if we can't parse questions
    return <div className="text-sm text-muted-foreground">{clarificationText}</div>;
  }

  return (
    <div className="w-full">
      {preface && (
        <div className="mb-4">
          <MarkdownContent
            content={preface}
            isLoading={!!isLoading}
            rehypePlugins={rehypePlugins}
          />
        </div>
      )}
      <div className="space-y-4">
        {questions.map((q) => {
          const selectedText = selectedByQuestionIndex[q.index];
          return (
            <div
              key={q.index}
              className="rounded-xl border border-border/60 bg-transparent p-4"
            >
              <div className="mb-3 text-base font-medium text-foreground">
                {q.title}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((o) => {
                  const isSelected = selectedText === o.text;
                  return (
                    <button
                      key={o.index}
                      type="button"
                      disabled={isLoading || submitting || isCompleted}
                      onClick={() => {
                        setSelectedByQuestionIndex((prev) => {
                          const next = { ...prev };
                          if (next[q.index] === o.text) {
                            delete next[q.index];
                            return next;
                          }
                          next[q.index] = o.text;
                          return next;
                        });
                      }}
                      className={cn(
                        "flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-left enabled:cursor-pointer enabled:hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-70",
                        isSelected
                          ? "bg-primary/10 text-primary enabled:hover:bg-primary/10"
                          : null,
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 place-items-center rounded-full border",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-background text-muted-foreground",
                        )}
                      >
                        {isSelected ? <CheckIcon className="size-3" /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] leading-snug">
                          <span className="mr-1 text-muted-foreground">
                            {o.index + 1}.
                          </span>
                          {o.text}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0 text-base font-medium text-foreground">
            补充说明
          </div>
          <input
            value={supplement}
            onChange={(e) => setSupplement(e.target.value)}
            placeholder="如果没有补充说明，请留空"
            className="h-10 w-full flex-1 rounded-lg border border-border/60 bg-background px-3 text-[15px] placeholder:text-[15px] outline-none focus:border-primary"
            disabled={isLoading || submitting || isCompleted}
          />
        </div>
      </div>

      {!isCompleted && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={isLoading || submitting || selectedCount <= 0}
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

