"use client";

import type { BaseStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { useEffect, useMemo, useState } from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getMissingInfoClarificationArgs,
  parseClarificationQuestions,
  type MissingInfoClarificationArgs,
} from "@/lib/langgraph/core/messages/utils";
import { cn } from "@/lib/utils";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
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

type ClarificationToolQuestion = {
  question?: unknown;
  options?: unknown;
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


function parseQuestionsFromToolArgs(
  args: MissingInfoClarificationArgs,
): ClarificationQuestion[] {
  const questions = parseClarificationQuestions(args.questions);
  if (questions.length === 0) return [];

  const parsed = (questions as ClarificationToolQuestion[])
    .map((item, idx) => {
      const title = typeof item?.question === "string" ? item.question.trim() : "";
      if (!title) return null;

      const options = Array.isArray(item?.options)
        ? item.options
            .map((opt, optIdx) => {
              if (typeof opt !== "string") return null;
              const text = opt.trim();
              if (!text) return null;
              return {
                index: optIdx,
                text,
              } satisfies ClarificationQuestionOption;
            })
            .filter((opt): opt is ClarificationQuestionOption => !!opt)
        : [];

      return {
        index: idx,
        title,
        options,
      } satisfies ClarificationQuestion;
    })
    .filter((q): q is ClarificationQuestion => !!q);

  return parsed;
}

function parseSelectionMarkerFromThreadText(
  threadMessagesText: string,
  questions: ClarificationQuestion[],
): ClarificationSelection | null {
  function answerForQuestionLine(
    line: string,
    question: string,
  ): string | null {
    const raw = line.replace(/^- /, "").trim();
    if (!raw) return null;

    const q = question.trim();
    if (!q || !raw.startsWith(q)) return null;

    const rest = raw.slice(q.length).trimStart();
    if (!rest.startsWith("：") && !rest.startsWith(":")) return null;

    const answer = rest.slice(1).trim();
    return answer || null;
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

  const out: ClarificationSelection = { qa: {} };
  for (const line of lines) {
    const supplementMatch = /^补充说明[:：]\s*(.+)$/.exec(line);
    if (supplementMatch) {
      out.supplement = supplementMatch[1]?.trim();
      continue;
    }

    for (const question of questions) {
      const answer = answerForQuestionLine(line, question.title);
      if (!answer) continue;
      const key = normalizeForMatch(question.title);
      if (key) out.qa[key] = answer;
      break;
    }
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

/** 澄清消息之后：是否已有人类回复（锁定 UI）；以及用于回填的 marker（任一条含 marker 的 human） */
function getFollowupAfterClarification(
  messages: Message[],
  clarificationMessageId: string,
  questions: ClarificationQuestion[],
): { locked: boolean; marker: ClarificationSelection | null } {
  const idx = messages.findIndex((m) => m.id === clarificationMessageId);
  if (idx === -1) return { locked: false, marker: null };

  let locked = false;
  let marker: ClarificationSelection | null = null;
  for (let i = idx + 1; i < messages.length; i++) {
    const m = messages[i]!;
    if (m.type !== "human") continue;
    locked = true;
    const txt = textOfMessage(m);
    if (!marker && txt?.includes(MARKER_START)) {
      marker = parseSelectionMarkerFromThreadText(txt, questions);
    }
  }
  return { locked, marker };
}

export function ClarificationSelector({
  thread,
  threadId,
  isLoading,
  clarificationMessage,
  rehypePlugins,
}: ClarificationSelectorProps) {
  const { context: localContext } = useLocalSettings()[0];

  const { questions, preface } = useMemo(() => {
    const args = getMissingInfoClarificationArgs(clarificationMessage);
    if (!args) return { questions: [] as ClarificationQuestion[], preface: "" };
    return {
      questions: parseQuestionsFromToolArgs(args),
      preface: typeof args.context === "string" ? args.context.trim() : "",
    };
  }, [clarificationMessage]);

  const followup = useMemo(
    () =>
      getFollowupAfterClarification(
        thread.messages ?? [],
        clarificationMessage.id ?? "",
        questions,
      ),
    [thread.messages, clarificationMessage.id, questions],
  );

  const resolved = useMemo(
    () => resolveDefaultSelection(questions, followup.marker),
    [questions, followup.marker],
  );

  const [selectedByQuestionIndex, setSelectedByQuestionIndex] = useState<
    Record<number, string>
  >(resolved.selectedByQuestionIndex);
  const [supplement, setSupplement] = useState<string>(resolved.supplement);
  const [submitting, setSubmitting] = useState(false);

  // Guard against render loops:
  // `markerForThisClarification` and `resolved.selectedByQuestionIndex` are objects that may get
  // new references on each render even when the underlying marker content is unchanged.
  // Derive a stable key from marker values and only sync state when that key changes.
  const markerKey = useMemo(() => {
    const m = followup.marker;
    if (!m) return null;
    const qa = m.qa ?? {};
    const sortedKeys = Object.keys(qa).sort();
    const qaPart = sortedKeys.map((k) => `${k}:${qa[k]}`).join("|");
    return `${qaPart}::${m.supplement ?? ""}`;
  }, [followup.marker]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!markerKey) return;
    const nextSelected = resolved.selectedByQuestionIndex;
    const nextSupplement = resolved.supplement;
    const nextSelectedEmpty = Object.keys(nextSelected).length === 0;

    // When the user has already "continued" (followup.locked === true),
    // transient question/option changes during streaming can cause marker re-parsing
    // to temporarily yield an empty `nextSelected`, which makes checked options disappear.
    // Preserve the last non-empty selection in that situation.
    if (followup.locked && nextSelectedEmpty) {
      setSelectedByQuestionIndex((prev) => prev);
      setSupplement((prev) => (nextSupplement ? nextSupplement : prev));
      return;
    }

    setSelectedByQuestionIndex(nextSelected);
    setSupplement(nextSupplement);
    // Intentionally only depend on `markerKey` to avoid re-syncing state
    // when `resolved` gets new object references but the marker value is unchanged.
  }, [markerKey]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const selectedCount = useMemo(() => {
    return questions.filter((q) => !!selectedByQuestionIndex[q.index]).length;
  }, [questions, selectedByQuestionIndex]);

  const handleContinue = async () => {
    if (submitting) return;
    if (followup.locked) return;
    if (selectedCount <= 0 && !supplement.trim()) return;
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
        search_enabled: localContext.search_enabled ?? true,
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
    return null;
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
                      disabled={submitting || followup.locked}
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
                        <div className="flex items-start gap-1 text-[15px] leading-snug">
                          <span className="shrink-0 text-muted-foreground">
                            {o.index + 1}.
                          </span>
                          <span className="min-w-0">{o.text}</span>
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
            disabled={submitting || followup.locked}
          />
        </div>
      </div>

      {!followup.locked && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={
              submitting ||
              (selectedCount <= 0 && !supplement.trim())
            }
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
