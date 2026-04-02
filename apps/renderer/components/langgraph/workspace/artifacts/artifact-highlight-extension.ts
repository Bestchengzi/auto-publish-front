import Highlight from "@tiptap/extension-highlight";

export const HighlightWithSelectionMix = Highlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: (element) => {
          if (!(element instanceof HTMLElement)) return null;
          return (
            element.getAttribute("data-color") ??
            element.style.backgroundColor ??
            null
          );
        },
        renderHTML: (attributes) => {
          const color =
            typeof attributes.color === "string" ? attributes.color : null;
          if (!color) return {};
          return {
            "data-color": color,
            style: `--artifact-highlight-color:${color};background-color:${color};color:inherit`,
          };
        },
      },
    };
  },
});
