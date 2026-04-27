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

function escapeMarkdownTableCell(content: string): string {
  return content
    .replace(/\r?\n+/g, "<br>")
    .replace(/\|/g, "\\|")
    .trim();
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

  td.addRule("artifactMarkdownTable", {
    filter(node) {
      return node.nodeName === "TABLE";
    },
    replacement(_content, node) {
      const rows = Array.from((node as HTMLElement).querySelectorAll("tr"))
        .map((row) =>
          Array.from(row.querySelectorAll("th,td")).map((cell) => {
            const markdown = td.turndown(cell.innerHTML);
            return escapeMarkdownTableCell(markdown);
          }),
        )
        .filter((row) => row.length > 0);

      if (rows.length === 0) return "\n\n";

      const columnCount = Math.max(...rows.map((row) => row.length));
      const normalizeRow = (row: string[]) =>
        Array.from({ length: columnCount }, (_, index) => row[index] ?? "");
      const header = normalizeRow(rows[0]);
      const bodyRows = rows.slice(1).map(normalizeRow);
      const separator = Array.from({ length: columnCount }, () => "---");
      const stringifyRow = (row: string[]) => `| ${row.join(" | ")} |`;

      return [
        "",
        stringifyRow(header),
        stringifyRow(separator),
        ...bodyRows.map(stringifyRow),
        "",
        "",
      ].join("\n");
    },
  });

  return td;
}
