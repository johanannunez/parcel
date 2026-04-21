export type ParsedDraft = {
  title: string;
  summary: string;
  content: string; // HTML, ready for HelpArticleEditor (Tiptap)
  tags: string[];
  suggestedCategory: string;
  readTimeMinutes: number;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// Escape HTML entities first, then apply inline markdown formatting.
function processInline(text: string): string {
  return inlineMarkdown(escapeHtml(text));
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    const t = line.trim();

    if (t.startsWith("### ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h3>${processInline(t.slice(4))}</h3>`);
    } else if (t.startsWith("## ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h2>${processInline(t.slice(3))}</h2>`);
    } else if (t.startsWith("# ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h1>${processInline(t.slice(2))}</h1>`);
    } else if (t.startsWith("- ")) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${processInline(t.slice(2))}</li>`);
    } else if (t === "") {
      if (inList) { out.push("</ul>"); inList = false; }
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<p>${processInline(t)}</p>`);
    }
  }

  if (inList) out.push("</ul>");
  return out.join("\n");
}

export function parseAlcoveDraft(raw: string): ParsedDraft | null {
  // Strip optional --- delimiters
  const text = raw.replace(/^---\s*\n?/, "").replace(/\n?---\s*$/, "").trim();

  const titleMatch = text.match(/^TITLE:\s*(.+)$/m);
  const summaryMatch = text.match(/^SUMMARY:\s*(.+)$/m);
  const tagsMatch = text.match(/^TAGS:\s*(.+)$/m);
  const categoryMatch = text.match(/^CATEGORY:\s*(.+)$/m);
  const readTimeMatch = text.match(/^READ\s*TIME:\s*(\d+)/im);

  if (!titleMatch || !summaryMatch) return null;

  // Handle CONTENT: at position 0 or after a newline.
  const contentStart = text.search(/(?:^|\n)CONTENT:\n/);
  const contentHeaderLen =
    contentStart === 0 ? "CONTENT:\n".length : "\nCONTENT:\n".length;
  const afterContent =
    contentStart !== -1 ? text.slice(contentStart + contentHeaderLen) : "";
  const nextLabelMatch = afterContent.match(/\n[A-Z][A-Z\s]+:/);
  const rawContent = nextLabelMatch
    ? afterContent.slice(0, nextLabelMatch.index).trim()
    : afterContent.trim();

  return {
    title: titleMatch[1].trim(),
    summary: summaryMatch[1].trim(),
    content: markdownToHtml(rawContent),
    tags: tagsMatch
      ? tagsMatch[1].split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    suggestedCategory: categoryMatch ? categoryMatch[1].trim() : "",
    readTimeMinutes: readTimeMatch ? parseInt(readTimeMatch[1], 10) : 5,
  };
}
