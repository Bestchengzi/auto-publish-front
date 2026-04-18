"use client";

import type { ReactNode } from "react";
import type { StreamdownProps } from "streamdown";

import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
} from "@/components/langgraph/ai-elements/code-block";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import { cn } from "@/lib/utils";

type StreamdownCodeProps = React.ComponentPropsWithoutRef<"code"> & {
  node?: {
    properties?: {
      className?: string[] | string;
    };
  };
  "data-block"?: boolean | string;
};

const CODE_LANGUAGE_PATTERN = /(?:lang|language)-([a-z0-9+#._-]+)/i;

function flattenText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (!children) return "";
  if (Array.isArray(children)) {
    return children.map(flattenText).join("");
  }
  if (typeof children === "object" && "props" in children) {
    return flattenText(
      (children as { props?: { children?: ReactNode } }).props?.children,
    );
  }
  return "";
}

function trimTrailingNewlines(value: string) {
  return value.replace(/\n+$/, "");
}

function getLanguageFromClassName(
  className?: string,
  nodeClassName?: string[] | string,
) {
  const combinedClassName = [
    ...(Array.isArray(nodeClassName) ? nodeClassName : [nodeClassName]),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return CODE_LANGUAGE_PATTERN.exec(combinedClassName)?.[1]?.toLowerCase() ?? "text";
}

function MessageInlineCode({
  className,
  children,
  node,
  ...props
}: StreamdownCodeProps) {
  void node;
  return (
    <code
      className={cn(
        "rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-[0.875em] text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

function MessageCodeBlock({
  className,
  children,
  node,
  "data-block": dataBlock,
  ...props
}: StreamdownCodeProps) {
  const { t } = useI18n();
  void dataBlock;
  const language = getLanguageFromClassName(
    className,
    node?.properties?.className,
  );
  const code = trimTrailingNewlines(flattenText(children));

  return (
    <CodeBlock
      className="my-4"
      code={code}
      language={language}
      showLineNumbers={false}
      {...props}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <CodeBlockDownloadButton aria-label={t.common.download} />
            }
          />
          <TooltipContent>{t.common.download}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <CodeBlockCopyButton aria-label={t.clipboard.copyToClipboard} />
            }
          />
          <TooltipContent>{t.clipboard.copyToClipboard}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </CodeBlock>
  );
}

export const messageCodeComponents = {
  code: MessageCodeBlock,
  inlineCode: MessageInlineCode,
} satisfies NonNullable<StreamdownProps["components"]>;
