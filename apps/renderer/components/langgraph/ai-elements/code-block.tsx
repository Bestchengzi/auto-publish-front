"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useState,
} from "react";
import { type BundledLanguage, codeToHtml, type ShikiTransformer } from "shiki";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
  showLineNumbers?: boolean;
};

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

const lineNumberTransformer: ShikiTransformer = {
  name: "line-numbers",
  line(node, line) {
    node.children.unshift({
      type: "element",
      tagName: "span",
      properties: {
        className: [
          "inline-block",
          "min-w-10",
          "mr-4",
          "text-right",
          "select-none",
          "text-muted-foreground",
        ],
      },
      children: [{ type: "text", value: String(line) }],
    });
  },
};

export async function highlightCode(
  code: string,
  language: BundledLanguage,
  showLineNumbers = false,
) {
  const transformers: ShikiTransformer[] = showLineNumbers
    ? [lineNumberTransformer]
    : [];

  return await Promise.all([
    codeToHtml(code, {
      lang: language,
      theme: "one-light",
      transformers,
    }),
    codeToHtml(code, {
      lang: language,
      theme: "one-dark-pro",
      transformers,
    }),
  ]);
}

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [html, setHtml] = useState<string>("");
  const [darkHtml, setDarkHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    highlightCode(code, language, showLineNumbers).then(([light, dark]) => {
      if (!cancelled) {
        setHtml(light);
        setDarkHtml(dark);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language, showLineNumbers]);

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          "group relative size-full overflow-hidden rounded-2xl border border-border bg-background text-foreground",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <span className="min-w-0 truncate font-mono lowercase">
            {language}
          </span>
          {children ? (
            <div className="flex shrink-0 items-center gap-1">{children}</div>
          ) : null}
        </div>
        <div className="relative size-full">
          <div
            className="overflow-auto px-4 py-4 dark:hidden [&>pre]:m-0 [&>pre]:border-none! [&>pre]:bg-transparent! [&>pre]:p-0! [&>pre]:text-foreground! [&>pre]:text-sm [&>pre]:whitespace-pre-wrap [&_code]:font-mono [&_code]:text-sm"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div
            className="hidden overflow-auto px-4 py-4 dark:block [&>pre]:m-0 [&>pre]:border-none! [&>pre]:bg-transparent! [&>pre]:p-0! [&>pre]:text-foreground! [&>pre]:text-sm [&>pre]:whitespace-pre-wrap [&_code]:font-mono [&_code]:text-sm"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: darkHtml }}
          />
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  title,
  "aria-label": ariaLabel,
  ...props
}: CodeBlockCopyButtonProps) => {
  const { t } = useI18n();
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;
  const resolvedLabel =
    ariaLabel ??
    (isCopied ? t.clipboard.copiedToClipboard : t.clipboard.copyToClipboard);
  const resolvedTitle = title ?? resolvedLabel;

  return (
    <Button
      aria-label={resolvedLabel}
      className={cn(
        "size-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={copyToClipboard}
      size="icon-sm"
      title={resolvedTitle}
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
