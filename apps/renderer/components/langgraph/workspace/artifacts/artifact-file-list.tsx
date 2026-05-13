import { useCallback } from "react";

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFileExtensionDisplayName,
  getFileIcon,
  getFileName,
  isDisplayableArtifactFile,
} from "@/lib/langgraph/core/utils/files";
import { cn } from "@/lib/utils";

import { ArtifactDownloadButton } from "./artifact-download-button";
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
              <ArtifactDownloadButton filepath={file} threadId={threadId} />
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </ul>
  );
}
