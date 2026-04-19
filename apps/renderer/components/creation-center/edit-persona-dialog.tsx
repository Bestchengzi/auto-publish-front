"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PlatformLogo } from "@/components/account-management/platform-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  artifactEditorContentClassName,
} from "@/components/langgraph/workspace/artifacts/artifact-editor-prosemirror-classes";
import { createArtifactTurndownService } from "@/components/langgraph/workspace/artifacts/artifact-editor-turndown";
import {
  ensureMandatoryTitleMarkdown,
  MandatoryTitleExtension,
  mandatoryTitlePlaceholderForNode,
} from "@/components/langgraph/workspace/artifacts/mandatory-title-extension";
import {
  updatePersona,
  type PersonaPlatform,
  type PersonaResponse,
} from "@/lib/api/personas";
import { cn } from "@/lib/utils";

function extractNameFromMarkdown(markdown: string): string | null {
  const heading = markdown
    .split("\n")
    .find((line) => line.trim().startsWith("# "));

  if (!heading) {
    return null;
  }

  const name = heading.replace(/^#\s+/, "").trim();
  return name.length > 0 ? name.slice(0, 128) : null;
}

export function EditPersonaDialog({
  open,
  persona,
  onOpenChange,
}: {
  open: boolean;
  persona: PersonaResponse;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("creationCenter.new");
  const tGlobal = useTranslations();
  const queryClient = useQueryClient();
  const turndownRef = useRef(createArtifactTurndownService());
  const [platform, setPlatform] = useState<PersonaPlatform>(persona.platform);
  const [markdown, setMarkdown] = useState(
    ensureMandatoryTitleMarkdown(persona.content),
  );

  const platformOptions = useMemo(
    () => [
      { id: "rednote" as const, label: tGlobal("account.platforms.rednote") },
      { id: "toutiao" as const, label: tGlobal("account.platforms.toutiao") },
      {
        id: "wechat_mp" as const,
        label: tGlobal("account.platforms.wechat_mp"),
      },
      { id: "zhihu" as const, label: tGlobal("account.platforms.zhihu") },
      {
        id: "baijiahao" as const,
        label: tGlobal("account.platforms.baijiahao"),
      },
      { id: "csdn" as const, label: tGlobal("account.platforms.csdn") },
    ],
    [tGlobal],
  );
  const selectedPlatformOption = useMemo(
    () => platformOptions.find((option) => option.id === platform) ?? null,
    [platform, platformOptions],
  );

  const updatePersonaMutation = useMutation({
    mutationFn: async (params: {
      personaId: string;
      payload: { name: string; platform: PersonaPlatform; content: string };
    }) => updatePersona(params.personaId, params.payload),
  });

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
        }),
        MandatoryTitleExtension,
        Placeholder.configure({
          showOnlyCurrent: false,
          placeholder: ({ editor: currentEditor, node }) =>
            mandatoryTitlePlaceholderForNode(
              currentEditor,
              node,
              t("editPersonaDialog.titlePlaceholder"),
            ),
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        TextStyle,
        Color,
        Link.configure({
          openOnClick: false,
          autolink: true,
        }),
        Underline,
        Image.configure({
          inline: false,
          allowBase64: true,
        }),
      ],
      content: "",
      immediatelyRender: false,
      editorProps: {
        attributes: {
          spellcheck: "false",
          autocorrect: "off",
          autocapitalize: "off",
          "data-gramm": "false",
        },
      },
      onUpdate({ editor: currentEditor }) {
        const nextMarkdown = turndownRef.current.turndown(
          currentEditor.getHTML(),
        );
        setMarkdown(ensureMandatoryTitleMarkdown(nextMarkdown));
      },
    },
    [t],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialMarkdown = ensureMandatoryTitleMarkdown(persona.content);
    setPlatform(persona.platform);
    setMarkdown(initialMarkdown);

    if (!editor) {
      return;
    }

    const hydrate = async () => {
      const html = await marked.parse(initialMarkdown);

      editor
        .chain()
        .setContent(typeof html === "string" ? html : "", {
          emitUpdate: false,
        })
        .run();
    };

    void hydrate();
  }, [editor, open, persona.content, persona.id, persona.platform]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        initialFocus={() =>
          document.querySelector(
            '[data-edit-persona-platform-trigger="true"]',
          ) as HTMLElement | null
        }
      >
        <DialogHeader>
          <DialogTitle>{t("editPersonaDialog.title")}</DialogTitle>
          <DialogDescription>{t("editPersonaDialog.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("editPersonaDialog.platformLabel")}
            </div>
            <Select
              value={platform}
              onValueChange={(value) => setPlatform(value as PersonaPlatform)}
            >
              <SelectTrigger
                className="w-56"
                data-edit-persona-platform-trigger="true"
              >
                <SelectValue className="sr-only" />
                <span className="flex min-w-0 items-center gap-2">
                  {selectedPlatformOption ? (
                    <>
                      <PlatformLogo
                        platformId={selectedPlatformOption.id}
                        size={18}
                        className="shrink-0 rounded-sm"
                      />
                      <span className="truncate">
                        {selectedPlatformOption.label}
                      </span>
                    </>
                  ) : null}
                </span>
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    className="[&>span.absolute.right-2]:size-5 [&>span.absolute.right-2_svg]:size-4"
                  >
                    <PlatformLogo
                      platformId={option.id}
                      size={18}
                      className="shrink-0 rounded-sm"
                    />
                    <span>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("editPersonaDialog.markdownLabel")}
            </div>
            <div className="rounded-md border border-border bg-background">
              <div className="max-h-[420px] overflow-auto p-4">
                <EditorContent
                  className={cn(artifactEditorContentClassName, "min-h-[320px]")}
                  editor={editor}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updatePersonaMutation.isPending}
          >
            {t("editPersonaDialog.cancel")}
          </Button>
          <Button
            onClick={async () => {
              const content = markdown.trim();
              if (!content) {
                toast.error(t("editPersonaDialog.emptyMarkdown"));
                return;
              }

              const name = extractNameFromMarkdown(content);
              if (!name) {
                toast.error(t("editPersonaDialog.titleRequired"));
                return;
              }

              try {
                await updatePersonaMutation.mutateAsync({
                  personaId: persona.id,
                  payload: {
                    name,
                    platform,
                    content,
                  },
                });
                await queryClient.invalidateQueries({
                  queryKey: ["personas", "list"],
                });
                onOpenChange(false);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : t("editPersonaDialog.saveFailed"),
                );
              }
            }}
            disabled={updatePersonaMutation.isPending}
          >
            {t("editPersonaDialog.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
