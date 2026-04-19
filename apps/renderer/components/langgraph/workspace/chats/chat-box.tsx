import { FilesIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { GroupImperativeHandle } from "react-resizable-panels";

import { ConversationEmptyState } from "@/components/langgraph/ai-elements/conversation";
import { PublishFlowUi } from "@/components/publish";
import { Button } from "@/components/ui/button";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  extractPresentFilesFromMessage,
  hasPresentFiles,
} from "@/lib/langgraph/core/messages/utils";
import { cn } from "@/lib/utils";

import { ArtifactFileDetail, ArtifactFileList, useArtifacts } from "../artifacts";
import { useThread } from "../messages/context";

const CLOSE_MODE = { chat: 100, artifacts: 0 };
const OPEN_MODE = { chat: 50, artifacts: 50 };

function ChatBox({
  children,
  threadId,
}: {
  children: ReactNode;
  threadId: string;
}) {
  const { thread } = useThread();
  const threadIdRef = useRef(threadId);
  const layoutRef = useRef<GroupImperativeHandle>(null);
  const presentFilesHydratedRef = useRef(false);
  const lastAutoOpenedPresentFilesIdRef = useRef<string | null>(null);

  const {
    open: artifactsOpen,
    setOpen: setArtifactsOpen,
    setArtifacts,
    select: selectArtifact,
    deselect,
    selectedArtifact,
  } = useArtifacts();

  const markdownArtifacts = useMemo(
    () =>
      (thread.values.artifacts ?? []).filter((file) =>
        file.toLowerCase().endsWith(".md"),
      ),
    [thread.values.artifacts],
  );

  const latestPresentedMarkdownArtifact = useMemo(() => {
    for (let index = thread.messages.length - 1; index >= 0; index -= 1) {
      const message = thread.messages[index];
      if (!message || !hasPresentFiles(message)) {
        continue;
      }

      const markdownFiles = extractPresentFilesFromMessage(message).filter(
        (file) => file.toLowerCase().endsWith(".md"),
      );
      if (markdownFiles.length === 0) {
        continue;
      }

      return {
        messageId: String(message.id ?? `present-files-${index}`),
        filepath: markdownFiles[0]!,
      };
    }

    return null;
  }, [thread.messages]);

  useEffect(() => {
    if (threadIdRef.current !== threadId) {
      threadIdRef.current = threadId;
      presentFilesHydratedRef.current = false;
      lastAutoOpenedPresentFilesIdRef.current = null;
      deselect();
    }

    setArtifacts(markdownArtifacts);
  }, [deselect, markdownArtifacts, setArtifacts, threadId]);

  useEffect(() => {
    if (!presentFilesHydratedRef.current) {
      if (thread.isThreadLoading) {
        return;
      }
      lastAutoOpenedPresentFilesIdRef.current =
        latestPresentedMarkdownArtifact?.messageId ?? null;
      presentFilesHydratedRef.current = true;
      return;
    }

    if (!latestPresentedMarkdownArtifact) {
      return;
    }
    if (
      latestPresentedMarkdownArtifact.messageId ===
      lastAutoOpenedPresentFilesIdRef.current
    ) {
      return;
    }

    lastAutoOpenedPresentFilesIdRef.current =
      latestPresentedMarkdownArtifact.messageId;
    selectArtifact(latestPresentedMarkdownArtifact.filepath);
    setArtifactsOpen(true);
  }, [
    latestPresentedMarkdownArtifact,
    selectArtifact,
    setArtifactsOpen,
    thread.isThreadLoading,
  ]);

  useEffect(() => {
    if (!layoutRef.current) return;
    layoutRef.current.setLayout(artifactsOpen ? OPEN_MODE : CLOSE_MODE);
  }, [artifactsOpen]);

  return (
    <div className="relative size-full">
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={{ chat: 100, artifacts: 0 }}
        groupRef={layoutRef}
      >
        <ResizablePanel className="relative" defaultSize={100} id="chat">
          {children}
        </ResizablePanel>
        <ResizablePanel
          className={cn(
            "transition-all duration-300 ease-in-out",
            !artifactsOpen && "opacity-0",
          )}
          id="artifacts"
        >
          <div
            className={cn(
              "h-full transition-transform duration-300 ease-in-out",
              selectedArtifact ? "p-0" : "p-4",
              artifactsOpen
                ? "translate-x-0 border-l border-border"
                : "translate-x-full border-l-0",
            )}
          >
            {selectedArtifact ? (
              <ArtifactFileDetail
                className="size-full rounded-none border-0 shadow-none"
                filepath={selectedArtifact}
                threadId={threadId}
              />
            ) : (
              <div className="relative flex size-full justify-center">
                <div className="absolute top-1 right-1 z-30">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setArtifactsOpen(false);
                    }}
                  >
                    <XIcon />
                  </Button>
                </div>
                {markdownArtifacts.length === 0 ? (
                  <ConversationEmptyState
                    icon={<FilesIcon />}
                    title="No artifact selected"
                    description="Select an artifact to view its details"
                  />
                ) : (
                  <div className="flex size-full max-w-(--container-width-sm) flex-col justify-center p-4 pt-8">
                    <header className="shrink-0">
                      <h2 className="text-lg font-medium">Artifacts</h2>
                    </header>
                    <main className="min-h-0 grow">
                      <ArtifactFileList
                        className="max-w-(--container-width-sm) p-4 pt-12"
                        files={markdownArtifacts}
                        threadId={threadId}
                      />
                    </main>
                  </div>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <PublishFlowUi />
    </div>
  );
}

export { ChatBox };
