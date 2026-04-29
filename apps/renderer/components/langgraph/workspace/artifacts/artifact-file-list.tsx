import { DownloadIcon } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { urlOfArtifact } from "@/lib/langgraph/core/artifacts/utils";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import {
  getFileExtensionDisplayName,
  getFileIcon,
  getFileName,
  isDisplayableArtifactFile,
} from "@/lib/langgraph/core/utils/files";
import { cn } from "@/lib/utils";

import { useArtifacts } from "./context";

export function ArtifactFileList({
  className,
  files,
  threadId,
}: {
  className?: string;
  files: string[];
  threadId: string;
}) {
  const { t } = useI18n();
  const { select: selectArtifact, setOpen } = useArtifacts();
  const displayableFiles = files.filter(isDisplayableArtifactFile);

  const handleClick = useCallback(
    (filepath: string) => {
      selectArtifact(filepath);
      setOpen(true);
    },
    [selectArtifact, setOpen],
  );

  if (displayableFiles.length === 0) {
    return null;
  }

  return (
    <ul className={cn("flex w-full flex-col gap-4", className)}>
      {displayableFiles.map((file) => (
        <Card
          key={file}
          className="relative cursor-pointer p-3"
          onClick={() => handleClick(file)}
        >
          <CardHeader className="pr-2 pl-1">
            <CardTitle className="relative pl-8">
              <div>{getFileName(file)}</div>
              <div className="absolute top-2 -left-0.5">
                {getFileIcon(file, "size-6")}
              </div>
            </CardTitle>
            <CardDescription className="pl-8 text-xs">
              {getFileExtensionDisplayName(file)} file
            </CardDescription>
            <CardAction>
              <a
                href={urlOfArtifact({
                  filepath: file,
                  threadId: threadId,
                  download: true,
                })}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost">
                  <DownloadIcon className="size-4" />
                  {t.common.download}
                </Button>
              </a>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </ul>
  );
}
