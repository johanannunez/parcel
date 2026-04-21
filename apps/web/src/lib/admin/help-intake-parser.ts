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

function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inList = false;

  for (const line of lines) {
    const t = line.trim();

    if (t.startsWith("### ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h3>${escapeHtml(t.slice(4))}</h3>`);
    } else if (t.startsWith("## ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h2>${escapeHtml(t.slice(3))}</h2>`);
    } else if (t.startsWith("# ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h1>${escapeHtml(t.slice(2))}</h1>`);
    } else if (t.startsWith("- ")) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inlineMarkdown(t.slice(2))}</li>`);
    } else if (t === "") {
      if (inList) { out.push("</ul>"); inList = false; }
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<p>${inlineMarkdown(t)}</p>`);
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

  // Extract CONTENT block: everything between "CONTENT:\n" and the next all-caps label
  const contentStart = text.indexOf("\nCONTENT:\n");
  const afterContent =
    contentStart !== -1
      ? text.slice(contentStart + "\nCONTENT:\n".length)
      : "";
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
