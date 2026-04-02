import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";

const MANDATORY_TITLE_PLACEHOLDER = "输入标题...";

function isDocFirstBlockMandatoryTitle(doc: PMNode) {
  const first = doc.firstChild;
  return (
    first !== null &&
    first.type.name === "heading" &&
    first.attrs.level === 1
  );
}

/** 供 @tiptap/extension-placeholder：仅文档第一个块且为一级标题时返回文案，否则 "" */
export function mandatoryTitlePlaceholderForNode(
  editor: Editor,
  node: PMNode,
  placeholder = MANDATORY_TITLE_PLACEHOLDER,
) {
  const first = editor.state.doc.firstChild;
  if (first === null || !first.eq(node)) return "";
  if (node.type.name !== "heading" || node.attrs.level !== 1) return "";
  return placeholder;
}

/** 首块须为 H1，不可删改类型 */
export const MandatoryTitleExtension = Extension.create({
  name: "mandatoryTitle",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (tr, oldState) =>
          !tr.docChanged ||
          isDocFirstBlockMandatoryTitle(tr.doc) ||
          !isDocFirstBlockMandatoryTitle(oldState.doc),
        props: {
          handleKeyDown(view, event) {
            if (event.key !== "Backspace" && event.key !== "Delete") return false;
            const { state } = view;
            const first = state.doc.firstChild;
            if (
              first === null ||
              first.type.name !== "heading" ||
              first.attrs.level !== 1
            ) {
              return false;
            }
            if (first.textContent.trim().length > 0) return false;
            const { $from, $to } = state.selection;
            if ($from.index(0) !== 0 || $to.index(0) !== 0) return false;
            return true;
          },
        },
      }),
    ];
  },
});

export function ensureMandatoryTitleMarkdown(md: string): string {
  const normalized = md.replace(/\r\n/g, "\n");
  const trimmed = normalized.trim();
  if (!trimmed) return "#\n\n";
  const firstLine = trimmed.split("\n")[0] ?? "";
  const isH1 =
    firstLine.startsWith("#") &&
    !firstLine.startsWith("##") &&
    (firstLine === "#" || firstLine === "# " || /^#[^#]/.test(firstLine));
  if (isH1) return trimmed;
  return `#\n\n${trimmed}`;
}

/** 选区是否完全落在首块 H1（用于隐藏段落/标题浮层等） */
export function isSelectionInMandatoryTitle(editor: Editor): boolean {
  const { $from, $to } = editor.state.selection;
  if ($from.index(0) !== 0 || $to.index(0) !== 0) return false;
  return isDocFirstBlockMandatoryTitle(editor.state.doc);
}
