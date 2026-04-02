import type { Editor } from "@tiptap/core";

export function normalizeAndValidateUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** unsetLink / setLink on the link mark that contains `anchor` (ProseMirror link DOM). */
export function runHoverLinkCommand(
  editor: Editor,
  anchor: HTMLElement,
  action: "unset" | { href: string },
) {
  try {
    const pos = editor.view.posAtDOM(anchor, 0);
    const chain = editor
      .chain()
      .focus()
      .setTextSelection(pos)
      .extendMarkRange("link");
    if (action === "unset") {
      chain.unsetLink().run();
    } else {
      chain.setLink({ href: action.href }).run();
    }
  } catch {
    /* anchor detached */
  }
}
