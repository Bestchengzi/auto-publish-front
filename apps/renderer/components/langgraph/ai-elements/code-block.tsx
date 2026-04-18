"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type BundledLanguage, codeToHtml, type ShikiTransformer } from "shiki";

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
};

type CodeBlockContextType = {
  code: string;
  language: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
  language: "text",
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createFallbackCodeHtml(code: string) {
  return `<pre><code>${escapeHtml(code)}</code></pre>`;
}

export async function highlightCode(
  code: string,
  language: string,
  showLineNumbers = false,
) {
  const transformers: ShikiTransformer[] = showLineNumbers
    ? [lineNumberTransformer]
    : [];

  try {
    return await Promise.all([
      codeToHtml(code, {
        lang: language as BundledLanguage,
        theme: "one-light",
        transformers,
      }),
      codeToHtml(code, {
        lang: language as BundledLanguage,
        theme: "one-dark-pro",
        transformers,
      }),
    ]);
  } catch {
    const fallbackHtml = createFallbackCodeHtml(code);
    return [fallbackHtml, fallbackHtml];
  }
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
  const displayLanguage = language.trim().toLowerCase() || "text";

  useEffect(() => {
    let cancelled = false;

    highlightCode(code, displayLanguage, showLineNumbers).then(([light, dark]) => {
      if (!cancelled) {
        setHtml(light);
        setDarkHtml(dark);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, displayLanguage, showLineNumbers]);

  return (
    <CodeBlockContext.Provider value={{ code, language: displayLanguage }}>
      <div
        className={cn(
          "group relative size-full overflow-hidden rounded-2xl border border-border bg-background text-foreground",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <span className="min-w-0 truncate font-mono lowercase">
            {displayLanguage}
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
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
        timeoutRef.current = null;
      }, timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      aria-label="Copy code"
      className={cn(
        "size-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={copyToClipboard}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};

const DOWNLOAD_EXTENSION_MAP: Record<string, string> = {
  bash: "sh",
  shell: "sh",
  sh: "sh",
  zsh: "sh",
  powershell: "ps1",
  ps1: "ps1",
  python: "py",
  py: "py",
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  jsx: "jsx",
  tsx: "tsx",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  sql: "sql",
  xml: "xml",
  yaml: "yml",
  yml: "yml",
  markdown: "md",
  md: "md",
  text: "txt",
  txt: "txt",
  plaintext: "txt",
};

function downloadCodeAsFile(filename: string, content: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type CodeBlockDownloadButtonProps = ComponentProps<typeof Button> & {
  onDownload?: () => void;
  onError?: (error: Error) => void;
};

export const CodeBlockDownloadButton = ({
  onDownload,
  onError,
  children,
  className,
  ...props
}: CodeBlockDownloadButtonProps) => {
  const { code, language } = useContext(CodeBlockContext);

  const downloadCode = () => {
    try {
      const extension = DOWNLOAD_EXTENSION_MAP[language] ?? "txt";
      downloadCodeAsFile(`code.${extension}`, code);
      onDownload?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <Button
      aria-label="Download code"
      className={cn(
        "size-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={downloadCode}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <DownloadIcon size={14} />}
    </Button>
  );
};
