"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { stashPendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import { createThread } from "@/lib/langgraph-client";

const HIGHLIGHTED_PARTS = [
  { text: "AI", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)" },
  { text: "创作专家", gradient: "linear-gradient(135deg,#a855f7,#ec4899)" },
  { text: "Creation Expert", gradient: "linear-gradient(135deg,#a855f7,#ec4899)" },
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
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/").filter(Boolean)[0] ?? "zh-CN";

  const startConversation = useCallback(async () => {
    const text = input.trim();
    if (!text || isStarting) return;
    setIsStarting(true);
    try {
      const threadId = await createThread({ metadata: {} });
      // 线程页挂载后再发首条消息（与 DeerFlow：创建后即对话一致）
      stashPendingInitialMessage({ threadId, text });
      router.push(`/${locale}/creation-center/${threadId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("createThreadFailed");
      toast.error(message);
      setIsStarting(false);
    }
  }, [input, isStarting, locale, router, t]);

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

        {/* 输入框区域 - 样式与选题中心一致 */}
        <div className="relative w-full rounded-2xl border border-primary bg-card shadow-[0_0_20px_rgba(124,58,237,0.25)] overflow-hidden">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void startConversation();
              }
            }}
            placeholder={t("inputPlaceholder")}
            rows={4}
            disabled={isStarting}
            className="min-h-[140px] border-0 rounded-none focus-visible:ring-0 resize-none px-4 pt-4 pb-10 md:text-base placeholder:text-base disabled:opacity-60"
          />
          <div className="absolute right-3 bottom-3">
            <Button
              type="button"
              size="icon"
              variant="default"
              className="size-8 shrink-0 rounded-full"
              disabled={!input.trim() || isStarting}
              aria-label={t("sendAria")}
              onClick={() => void startConversation()}
            >
              {isStarting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
