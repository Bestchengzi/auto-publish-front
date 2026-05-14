import {
  BookOpenTextIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileTypeIcon,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { urlOfArtifact } from "@/lib/langgraph/core/artifacts/utils";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import { getFileExtension } from "@/lib/langgraph/core/utils/files";
import { cn } from "@/lib/utils";

type ArtifactDownloadButtonProps = {
  className?: string;
  filepath: string;
  threadId: string;
};

function openDownloadUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ArtifactDownloadButton({
  className,
  filepath,
  threadId,
}: ArtifactDownloadButtonProps) {
  const { t } = useI18n();
  const extension = getFileExtension(filepath);
  const isMarkdown = extension === "md" || extension === "markdown";
  const markdownUrl = urlOfArtifact({ filepath, threadId, download: true });
  const wordUrl = urlOfArtifact({
    filepath,
    threadId,
    downloadType: "docx",
  });
  const buttonClassName = cn(
    buttonVariants({ variant: "ghost", size: "sm" }),
    "text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-lg px-2",
    className,
  );

  if (!isMarkdown) {
    return (
      <a
        href={markdownUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={t.common.download}
        aria-label={t.common.download}
        className={buttonClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <DownloadIcon className="size-4 shrink-0" />
        <span className="text-sm font-normal">{t.common.download}</span>
      </a>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={t.common.download}
            aria-label={t.common.download}
            className={cn(
              "text-muted-foreground hover:text-foreground h-8 gap-1.5 rounded-lg px-2",
              className,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <DownloadIcon className="size-4 shrink-0" />
            <span className="text-sm font-normal">{t.common.download}</span>
            <ChevronDownIcon className="size-3.5 shrink-0" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-40">
        <DropdownMenuItem
          className="py-2"
          onClick={(event) => {
            event.stopPropagation();
            openDownloadUrl(wordUrl);
          }}
        >
          <FileTypeIcon className="size-4" />
          Word 格式
        </DropdownMenuItem>
        <DropdownMenuItem
          className="py-2"
          onClick={(event) => {
            event.stopPropagation();
            openDownloadUrl(markdownUrl);
          }}
        >
          <BookOpenTextIcon className="size-4" />
          Markdown 格式
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
