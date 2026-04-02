import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  SquareCodeIcon,
  StrikethroughIcon,
  TextAlignJustifyIcon,
  TypeIcon,
  UnderlineIcon,
} from "lucide-react";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  DEFAULT_TEXT_COLOR_SWATCH,
  HIGHLIGHT_SWATCHES,
  TEXT_COLOR_SWATCHES,
} from "./artifact-editor-constants";
import { isSelectionInMandatoryTitle } from "./mandatory-title-extension";

function isBodyTextActive(editor: Editor) {
  return (
    !editor.isActive("heading") &&
    !editor.isActive("bulletList") &&
    !editor.isActive("orderedList") &&
    !editor.isActive("codeBlock")
  );
}

function applyBodyParagraph(editor: Editor) {
  const chain = editor.chain().focus();
  if (editor.isActive("bulletList")) chain.toggleBulletList();
  if (editor.isActive("orderedList")) chain.toggleOrderedList();
  chain.setParagraph().run();
}

function applyHeadingLevel(editor: Editor, level: 1 | 2 | 3 | 4) {
  editor.chain().focus().setNode("heading", { level }).run();
}

function headingLevelBadge(level: 1 | 2 | 3 | 4) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded border border-border text-[10px] font-semibold tabular-nums">
      H{level}
    </span>
  );
}

export type ArtifactEditorBubbleToolbarProps = {
  editor: Editor;
  disabled?: boolean;
  closeAllFloatingPanels: () => void;
  openBlockTypePanel: boolean;
  setOpenBlockTypePanel: (open: boolean) => void;
  openAlignPanel: boolean;
  setOpenAlignPanel: (open: boolean) => void;
  openColorPanel: "text" | "highlight" | null;
  setOpenColorPanel: (panel: "text" | "highlight" | null) => void;
  openLinkPanel: boolean;
  setOpenLinkPanel: (open: boolean) => void;
  linkInputValue: string;
  setLinkInputValue: (value: string) => void;
  applyLink: () => void;
  currentTextColor: string;
  currentHighlightColor: string;
  currentTextAlign: "left" | "center" | "right" | "justify";
  indentBounds: { canIncrease: boolean; canDecrease: boolean };
};

export function ArtifactEditorBubbleToolbar({
  editor,
  disabled = false,
  closeAllFloatingPanels,
  openBlockTypePanel,
  setOpenBlockTypePanel,
  openAlignPanel,
  setOpenAlignPanel,
  openColorPanel,
  setOpenColorPanel,
  openLinkPanel,
  setOpenLinkPanel,
  linkInputValue,
  setLinkInputValue,
  applyLink,
  currentTextColor,
  currentHighlightColor,
  currentTextAlign,
  indentBounds,
}: ArtifactEditorBubbleToolbarProps) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={() =>
        !disabled && editor.isEditable && !editor.state.selection.empty
      }
    >
      <TooltipProvider delay={0}>
        <div className="bg-background relative flex items-center gap-1 rounded-md border p-1 shadow-md">
        {!isSelectionInMandatoryTitle(editor) && (
          <>
        <Popover
          open={openBlockTypePanel}
          onOpenChange={(open) => {
            if (open) {
              closeAllFloatingPanels();
              setOpenBlockTypePanel(true);
            } else {
              closeAllFloatingPanels();
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className={cn(
                        "h-8 gap-1.5 rounded-sm px-2",
                        openBlockTypePanel && "bg-accent",
                      )}
                      aria-label="段落与标题"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <TypeIcon className="size-4 shrink-0" />
                      {openBlockTypePanel ? (
                        <ChevronUpIcon className="size-3.5 opacity-70" />
                      ) : (
                        <ChevronDownIcon className="size-3.5 opacity-70" />
                      )}
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="top">
              <p>段落与标题</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={8}
            className="w-52 bg-background p-1 data-open:animate-none data-closed:animate-none"
          >
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal",
                isBodyTextActive(editor) && "text-primary bg-accent/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                applyBodyParagraph(editor);
                closeAllFloatingPanels();
              }}
            >
              <span className="flex items-center gap-2">
                <TypeIcon
                  className={cn(
                    "size-4 shrink-0",
                    isBodyTextActive(editor) && "text-primary",
                  )}
                />
                正文
              </span>
              {isBodyTextActive(editor) ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
            {([1, 2, 3, 4] as const).map((level) => {
              const active = editor.isActive("heading", { level });
              return (
                <Button
                  key={level}
                  variant="ghost"
                  size="sm"
                  type="button"
                  className={cn(
                    "h-8 w-full justify-between rounded-sm px-2 font-normal",
                    active && "text-primary bg-accent/50",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    applyHeadingLevel(editor, level);
                    closeAllFloatingPanels();
                  }}
                >
                  <span className="flex items-center gap-2">
                    {headingLevelBadge(level)}
                    {level === 1
                      ? "一级标题"
                      : level === 2
                        ? "二级标题"
                        : level === 3
                          ? "三级标题"
                          : "四级标题"}
                  </span>
                  {active ? (
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                </Button>
              );
            })}
            <div
              className="my-1 h-px bg-border"
              role="separator"
              aria-hidden
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal",
                editor.isActive("bulletList") && "text-primary bg-accent/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                closeAllFloatingPanels();
              }}
            >
              <span className="flex items-center gap-2">
                <ListIcon className="size-4 shrink-0" />
                无序列表
              </span>
              {editor.isActive("bulletList") ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal",
                editor.isActive("orderedList") && "text-primary bg-accent/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                closeAllFloatingPanels();
              }}
            >
              <span className="flex items-center gap-2">
                <ListOrderedIcon className="size-4 shrink-0" />
                有序列表
              </span>
              {editor.isActive("orderedList") ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
          </PopoverContent>
        </Popover>
        <div
          className="mx-0.5 h-5 w-px shrink-0 bg-border"
          aria-hidden
        />
          </>
        )}
        <Popover
          open={openAlignPanel}
          onOpenChange={(open) => {
            if (open) {
              closeAllFloatingPanels();
              setOpenAlignPanel(true);
            } else {
              closeAllFloatingPanels();
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className={cn(
                        "h-8 gap-1.5 rounded-sm px-2",
                        openAlignPanel && "bg-accent",
                      )}
                      aria-label="文本对齐"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <TextAlignJustifyIcon className="size-4" />
                      {openAlignPanel ? (
                        <ChevronUpIcon className="size-3.5 opacity-70" />
                      ) : (
                        <ChevronDownIcon className="size-3.5 opacity-70" />
                      )}
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="top">
              <p>文本对齐</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={8}
            className="w-44 bg-background p-1 data-open:animate-none data-closed:animate-none"
          >
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal",
                currentTextAlign === "left" && "text-primary bg-accent/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const needsLeft = (
                  ["center", "right", "justify"] as const
                ).some((a) => editor.isActive({ textAlign: a }));
                if (needsLeft) {
                  editor.chain().focus().setTextAlign("left").run();
                }
                closeAllFloatingPanels();
              }}
            >
              <span className="flex items-center gap-2">
                <AlignLeftIcon className="size-4 shrink-0" />
                左对齐
              </span>
              {currentTextAlign === "left" ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal",
                currentTextAlign === "center" && "text-primary bg-accent/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (editor.isActive({ textAlign: "center" })) {
                  closeAllFloatingPanels();
                  return;
                }
                editor.chain().focus().setTextAlign("center").run();
                closeAllFloatingPanels();
              }}
            >
              <span className="flex items-center gap-2">
                <AlignCenterIcon className="size-4 shrink-0" />
                居中对齐
              </span>
              {currentTextAlign === "center" ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal",
                currentTextAlign === "right" && "text-primary bg-accent/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (editor.isActive({ textAlign: "right" })) {
                  closeAllFloatingPanels();
                  return;
                }
                editor.chain().focus().setTextAlign("right").run();
                closeAllFloatingPanels();
              }}
            >
              <span className="flex items-center gap-2">
                <AlignRightIcon className="size-4 shrink-0" />
                右对齐
              </span>
              {currentTextAlign === "right" ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-full justify-between rounded-sm px-2 font-normal",
                editor.isActive("codeBlock") && "text-primary bg-accent/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor.chain().focus().toggleCodeBlock().run();
                closeAllFloatingPanels();
              }}
            >
              <span className="flex items-center gap-2">
                <SquareCodeIcon className="size-4 shrink-0" />
                代码块
              </span>
              {editor.isActive("codeBlock") ? (
                <CheckIcon className="size-4 shrink-0 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
            </Button>
            <div
              className="my-1 h-px bg-border"
              role="separator"
              aria-hidden
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 w-full justify-start rounded-sm px-2 font-normal"
              disabled={!indentBounds.canIncrease}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                void (
                  editor.chain().focus() as unknown as {
                    increaseIndent: () => { run: () => boolean };
                  }
                ).increaseIndent().run();
                closeAllFloatingPanels();
              }}
            >
              <IndentIncreaseIcon className="mr-2 size-4 shrink-0" />
              增加缩进
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="h-8 w-full justify-start rounded-sm px-2 font-normal"
              disabled={!indentBounds.canDecrease}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                void (
                  editor.chain().focus() as unknown as {
                    decreaseIndent: () => { run: () => boolean };
                  }
                ).decreaseIndent().run();
                closeAllFloatingPanels();
              }}
            >
              <IndentDecreaseIcon className="mr-2 size-4 shrink-0" />
              减少缩进
            </Button>
          </PopoverContent>
        </Popover>
        <div
          className="mx-0.5 h-5 w-px shrink-0 bg-border"
          aria-hidden
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "rounded-sm",
                  editor.isActive("bold") && "bg-accent",
                )}
                onClick={() => editor.chain().focus().toggleBold().run()}
                type="button"
                aria-label="加粗"
              >
                <BoldIcon className="size-4" />
              </Button>
            }
          />
          <TooltipContent side="top">
            <p>加粗</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "rounded-sm",
                  editor.isActive("italic") && "bg-accent",
                )}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                type="button"
                aria-label="斜体"
              >
                <ItalicIcon className="size-4" />
              </Button>
            }
          />
          <TooltipContent side="top">
            <p>斜体</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "rounded-sm",
                  editor.isActive("strike") && "bg-accent",
                )}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                type="button"
                aria-label="删除线"
              >
                <StrikethroughIcon className="size-4" />
              </Button>
            }
          />
          <TooltipContent side="top">
            <p>删除线</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "rounded-sm",
                  editor.isActive("underline") && "bg-accent",
                )}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                type="button"
                aria-label="下划线"
              >
                <UnderlineIcon className="size-4" />
              </Button>
            }
          />
          <TooltipContent side="top">
            <p>下划线</p>
          </TooltipContent>
        </Tooltip>
        <Popover
          open={openLinkPanel}
          onOpenChange={(open) => {
            if (open) {
              closeAllFloatingPanels();
              setOpenLinkPanel(true);
              setLinkInputValue(
                (editor.getAttributes("link").href as string | undefined) ??
                  "",
              );
            } else {
              closeAllFloatingPanels();
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        "rounded-sm",
                        (editor.isActive("link") || openLinkPanel) &&
                          "bg-accent",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      type="button"
                      aria-label="链接"
                    >
                      <LinkIcon className="size-4" />
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="top">
              <p>链接</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            side="bottom"
            align="center"
            sideOffset={8}
            className="w-[400px] max-w-[calc(100vw-24px)] bg-background p-3 data-open:animate-none data-closed:animate-none"
          >
            <div className="flex items-center gap-2">
              <Input
                value={linkInputValue}
                onChange={(event) => setLinkInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyLink();
                  }
                }}
                placeholder="输入网址，如：www.example.com"
                className="h-8"
              />
              <Button
                type="button"
                size="default"
                onClick={applyLink}
                disabled={!linkInputValue.trim()}
                className="h-8 shrink-0 px-4"
              >
                确认
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Popover
          open={openColorPanel === "text"}
          onOpenChange={(open) => {
            if (open) {
              closeAllFloatingPanels();
              setOpenColorPanel("text");
            } else {
              closeAllFloatingPanels();
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      className={cn(
                        "relative rounded-sm",
                        openColorPanel === "text" && "bg-accent",
                      )}
                      aria-label="字体颜色"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <span className="mt-[-1px] inline-block origin-center scale-x-110 scale-y-90 text-[22px] font-normal text-red-500">
                        A
                      </span>
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="top">
              <p>字体颜色</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            side="bottom"
            align="center"
            sideOffset={8}
            className="w-auto max-w-[calc(100vw-16px)] overflow-x-auto bg-background p-2 data-open:animate-none data-closed:animate-none"
          >
            <div className="flex items-center gap-1">
              {TEXT_COLOR_SWATCHES.map((color) => (
                <Button
                  key={color}
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  className={cn(
                    "rounded-md",
                    currentTextColor.toLowerCase() ===
                      color.toLowerCase() && "bg-accent",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (
                      color.toLowerCase() ===
                      DEFAULT_TEXT_COLOR_SWATCH.toLowerCase()
                    ) {
                      editor.chain().focus().unsetColor().run();
                    } else {
                      editor.chain().focus().setColor(color).run();
                    }
                    closeAllFloatingPanels();
                  }}
                >
                  <span
                    className="inline-block origin-center scale-x-110 scale-y-90 text-[24px] leading-none font-normal"
                    style={{ color }}
                  >
                    A
                  </span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover
          open={openColorPanel === "highlight"}
          onOpenChange={(open) => {
            if (open) {
              closeAllFloatingPanels();
              setOpenColorPanel("highlight");
            } else {
              closeAllFloatingPanels();
            }
          }}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      className={cn(
                        "relative rounded-sm",
                        openColorPanel === "highlight" && "bg-accent",
                      )}
                      aria-label="背景颜色"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      <span
                        className="inline-block origin-center rounded-sm bg-[#fde047] px-0.5 text-lg leading-none font-normal text-[#374151] scale-x-110 scale-y-90"
                        aria-hidden
                      >
                        A
                      </span>
                    </Button>
                  }
                />
              }
            />
            <TooltipContent side="top">
              <p>背景颜色</p>
            </TooltipContent>
          </Tooltip>
          <PopoverContent
            side="bottom"
            align="center"
            sideOffset={8}
            className="w-auto max-w-[calc(100vw-16px)] overflow-x-auto bg-background p-2 data-open:animate-none data-closed:animate-none"
          >
            <div className="grid grid-cols-8 gap-2">
              <Button
                variant="ghost"
                size="icon-xs"
                type="button"
                className={cn(
                  "relative h-6 w-6 rounded bg-white p-0 shadow-[inset_0_0_0_1px_#d1d5db]",
                  !editor.isActive("highlight") && "ring-1 ring-ring",
                )}
                aria-label="清除背景色"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  closeAllFloatingPanels();
                }}
              >
                <span
                  className="absolute inset-0 block rounded"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, transparent calc(50% - 0.5px), #d1d5db calc(50% - 0.5px), #d1d5db calc(50% + 0.5px), transparent calc(50% + 0.5px))",
                  }}
                />
              </Button>
              {HIGHLIGHT_SWATCHES.map((color) => (
                <Button
                  key={color}
                  variant="ghost"
                  size="icon-xs"
                  type="button"
                  className={cn(
                    "h-6 w-6 rounded border p-0",
                    currentHighlightColor.toLowerCase() ===
                      color.toLowerCase() &&
                      editor.isActive("highlight") &&
                      "ring-2 ring-ring",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`背景色 ${color}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color }).run();
                    closeAllFloatingPanels();
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </TooltipProvider>
    </BubbleMenu>
  );
}
