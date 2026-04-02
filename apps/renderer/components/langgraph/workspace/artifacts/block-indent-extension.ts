import { Extension } from "@tiptap/core";
import type { CommandProps, Editor } from "@tiptap/core";
import type { Node, ResolvedPos } from "@tiptap/pm/model";

function getBlockNodesInSelection(
  doc: Node,
  $from: ResolvedPos,
  $to: ResolvedPos,
  types: Set<string>,
): { node: Node; pos: number }[] {
  const result: { node: Node; pos: number }[] = [];

  if ($from.pos === $to.pos) {
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (types.has(node.type.name)) {
        return [{ node, pos: $from.before(d) }];
      }
    }
    return [];
  }

  const seen = new Set<number>();
  doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
    if (!node.isBlock || !types.has(node.type.name)) return;
    if (seen.has(pos)) return;
    seen.add(pos);
    result.push({ node, pos });
  });
  return result;
}

const DEFAULT_TYPES = ["paragraph", "heading"] as const;

/** Used by toolbar to enable/disable indent buttons. */
export function getSelectionIndentBounds(
  editor: Editor,
  maxIndent = 8,
  types: readonly string[] = DEFAULT_TYPES,
) {
  const set = new Set(types);
  const blocks = getBlockNodesInSelection(
    editor.state.doc,
    editor.state.selection.$from,
    editor.state.selection.$to,
    set,
  );
  if (blocks.length === 0) {
    return { canIncrease: false, canDecrease: false };
  }
  let canIncrease = false;
  let canDecrease = false;
  for (const { node } of blocks) {
    const i = Number(node.attrs.indent) || 0;
    if (i < maxIndent) canIncrease = true;
    if (i > 0) canDecrease = true;
  }
  return { canIncrease, canDecrease };
}

export const BlockIndent = Extension.create({
  name: "blockIndent",

  addOptions() {
    return {
      types: ["paragraph", "heading"] as string[],
      minIndent: 0,
      maxIndent: 8,
      /** padding-left per level, in em */
      stepEm: 1.5,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              if (!(element instanceof HTMLElement)) return 0;
              const raw = element.getAttribute("data-indent");
              if (raw != null) {
                const n = parseInt(raw, 10);
                return Number.isFinite(n)
                  ? Math.min(
                      Math.max(n, this.options.minIndent),
                      this.options.maxIndent,
                    )
                  : 0;
              }
              return 0;
            },
            renderHTML: (attributes) => {
              const indent = Math.min(
                Math.max(Number(attributes.indent) || 0, this.options.minIndent),
                this.options.maxIndent,
              );
              if (indent === 0) return {};
              return {
                "data-indent": String(indent),
                style: `padding-left: ${indent * this.options.stepEm}em`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ state, dispatch }: CommandProps) => {
          const types = new Set<string>(this.options.types);
          const { maxIndent } = this.options;
          const tr = state.tr;
          const blocks = getBlockNodesInSelection(
            state.doc,
            state.selection.$from,
            state.selection.$to,
            types,
          );
          let changed = false;
          for (const { node, pos } of blocks) {
            const current = Number(node.attrs.indent) || 0;
            if (current >= maxIndent) continue;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: current + 1,
            });
            changed = true;
          }
          if (changed && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },

      decreaseIndent:
        () =>
        ({ state, dispatch }: CommandProps) => {
          const types = new Set<string>(this.options.types);
          const { minIndent } = this.options;
          const tr = state.tr;
          const blocks = getBlockNodesInSelection(
            state.doc,
            state.selection.$from,
            state.selection.$to,
            types,
          );
          let changed = false;
          for (const { node, pos } of blocks) {
            const current = Number(node.attrs.indent) || 0;
            if (current <= minIndent) continue;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: current - 1,
            });
            changed = true;
          }
          if (changed && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
    // TipTap RawCommands typing does not include custom extension commands here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },
});
