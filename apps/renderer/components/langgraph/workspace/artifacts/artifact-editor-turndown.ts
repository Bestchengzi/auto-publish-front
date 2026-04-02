import TurndownService from "turndown";

function indentLevel(node: HTMLElement): number {
  const raw = node.getAttribute("data-indent");
  if (raw == null) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function elementHasTextAlignStyle(el: HTMLElement): boolean {
  const t = el.style.textAlign;
  return t === "center" || t === "right" || t === "justify" || t === "left";
}

export function createArtifactTurndownService(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  td.keep(["span", "mark", "u", "s", "del"]);

  td.addRule("artifactTextAlignParagraph", {
    filter(node) {
      if (node.nodeName !== "P") return false;
      if (indentLevel(node as HTMLElement) > 0) return false;
      return elementHasTextAlignStyle(node as HTMLElement);
    },
    replacement(_content, node) {
      return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
    },
  });

  td.addRule("artifactTextAlignHeading", {
    filter(node) {
      if (!/^H[1-6]$/.test(node.nodeName)) return false;
      if (indentLevel(node as HTMLElement) > 0) return false;
      return elementHasTextAlignStyle(node as HTMLElement);
    },
    replacement(_content, node) {
      return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
    },
  });

  td.addRule("artifactIndentHeading", {
    filter(node) {
      if (!/^H[1-6]$/.test(node.nodeName)) return false;
      return indentLevel(node as HTMLElement) > 0;
    },
    replacement(_content, node) {
      return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
    },
  });

  td.addRule("artifactIndentParagraph", {
    filter(node) {
      if (node.nodeName !== "P") return false;
      return indentLevel(node as HTMLElement) > 0;
    },
    replacement(_content, node) {
      return `\n\n${(node as HTMLElement).outerHTML}\n\n`;
    },
  });

  td.addRule("artifactFencedCodeBlock", {
    filter(node) {
      return node.nodeName === "PRE";
    },
    replacement(_content, node) {
      const codeElement = node.firstElementChild;
      if (codeElement == null || codeElement.nodeName !== "CODE") {
        return "\n\n```\n```\n\n";
      }
      const className = codeElement.getAttribute("class") ?? "";
      const language = className
        .split(/\s+/)
        .find((token) => token.startsWith("language-"))
        ?.replace("language-", "")
        .trim();
      const body = codeElement.textContent ?? "";
      return `\n\n\`\`\`${language ?? ""}\n${body}\n\`\`\`\n\n`;
    },
  });

  return td;
}
