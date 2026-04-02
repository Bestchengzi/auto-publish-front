import { Link2Off, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";

import type { ArtifactLinkHoverControls } from "./use-artifact-link-hover";

export function ArtifactLinkHoverPopover({
  linkHover,
}: {
  linkHover: ArtifactLinkHoverControls;
}) {
  const {
    linkHoverAnchorRef,
    linkHoverCardRef,
    linkHoverOpen,
    hideLinkHoverCard,
    clearLinkHoverHideTimer,
    scheduleHideLinkHover,
    linkHoverHref,
    linkHoverEditing,
    linkHoverDraft,
    setLinkHoverDraft,
    setLinkHoverEditing,
    unlinkLinkFromHover,
    applyLinkEditFromHover,
  } = linkHover;

  return (
    <Popover
      open={linkHoverOpen}
      onOpenChange={(open) => {
        if (!open) hideLinkHoverCard();
      }}
      modal={false}
    >
      <PopoverContent
        anchor={linkHoverAnchorRef}
        side="bottom"
        align="start"
        sideOffset={0}
        positionMethod="fixed"
        positionerClassName="z-[200]"
        className="w-auto max-w-[min(calc(100vw-24px),420px)] p-0 data-open:animate-none data-closed:animate-none"
      >
        <div
          ref={linkHoverCardRef}
          role="dialog"
          aria-label="链接"
          className="box-border flex w-full min-w-0 items-center gap-2 p-2"
          onMouseEnter={clearLinkHoverHideTimer}
          onMouseLeave={scheduleHideLinkHover}
        >
          {linkHoverEditing ? (
            <div className="flex w-full min-w-0 flex-nowrap items-center gap-2">
              <Input
                value={linkHoverDraft}
                onChange={(e) => setLinkHoverDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLinkEditFromHover();
                  }
                }}
                placeholder="输入网址"
                className="h-8 w-[260px] shrink-0"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0"
                onClick={applyLinkEditFromHover}
              >
                确认
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0"
                onClick={() => {
                  setLinkHoverEditing(false);
                  setLinkHoverDraft(linkHoverHref);
                }}
              >
                取消
              </Button>
            </div>
          ) : (
            <>
              <span
                className="w-[220px] shrink-0 truncate text-sm text-muted-foreground"
                title={linkHoverHref}
              >
                {linkHoverHref || "（无地址）"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-md focus-visible:ring-0 focus-visible:border-transparent"
                title="编辑链接"
                aria-label="编辑链接"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setLinkHoverEditing(true);
                  setLinkHoverDraft(linkHoverHref);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-md focus-visible:ring-0 focus-visible:border-transparent"
                title="取消链接"
                aria-label="取消链接"
                onMouseDown={(e) => e.preventDefault()}
                onClick={unlinkLinkFromHover}
              >
                <Link2Off className="size-4" />
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
