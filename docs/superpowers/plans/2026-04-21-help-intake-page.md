# Help Center Intake Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/help/intake` — a two-phase admin page where Johan pastes a structured Alcove FAQ draft, reviews pre-filled fields, and publishes directly to the `help_articles` table.

**Architecture:** A pure parser utility converts the structured Alcove text output into typed fields including markdown-to-HTML conversion for the Tiptap editor. A server page fetches categories and hands off to a client component that manages the two-phase UX (paste → review form). The review form calls the existing `createArticle` server action with a `source:ai-intake` tag auto-appended.

**Tech Stack:** Next.js App Router, TypeScript, Tiptap (`HelpArticleEditor`), Supabase (existing `help_articles` + `help_categories` tables), existing `createArticle` server action.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/web/src/lib/admin/help-intake-parser.ts` | Pure parser: Alcove text → typed draft object + markdown-to-HTML |
| Create | `apps/web/src/app/(admin)/admin/help/intake/page.tsx` | Server component: fetch categories, render IntakePage |
| Create | `apps/web/src/app/(admin)/admin/help/intake/IntakePage.tsx` | Client component: paste phase + review form phase |
| Modify | `apps/web/src/app/(admin)/admin/help/page.tsx` | Add "New from Alcove" secondary button |

No DB migrations. No new server actions. No new API routes.

---

## Task 1: Parser utility

**Files:**
- Create: `apps/web/src/lib/admin/help-intake-parser.ts`

The Alcove prompt outputs this exact format:

```
---
TITLE: How do we handle items damaged by guests?

SUMMARY: This article explains how The Parcel Company evaluates and responds to guest-caused property damage.

CONTENT:
## What's Our Policy?

When a guest damages an item, you have options...

## Factors We Consider

- The cost of replacement
- Guest track record

TAGS: damage, refunds, guest policy

CATEGORY: Guest Management

READ TIME: 3
---
```

The parser extracts each block and converts the CONTENT markdown to HTML for Tiptap.

- [ ] **Step 1: Create the parser file**

```typescript
// apps/web/src/lib/admin/help-intake-parser.ts

export type ParsedDraft = {
  title: string;
  summary: string;
  content: string; // HTML, ready for HelpArticleEditor
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
      // blank line: skip, paragraph breaks come from <p> wrapping
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

  // Extract CONTENT block: everything between "CONTENT:\n" and the next all-caps label line
  const contentStart = text.indexOf("\nCONTENT:\n");
  const afterContent = contentStart !== -1
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
```

- [ ] **Step 2: Verify the parser manually**

Run this in a Node REPL or add a temporary test file to confirm it works:

```typescript
// Paste into a scratch file, run with: npx ts-node --skip-project scratch.ts
import { parseAlcoveDraft } from "./apps/web/src/lib/admin/help-intake-parser";

const sample = `---
TITLE: How do we handle items damaged by guests?

SUMMARY: This article explains how The Parcel Company responds to guest-caused damage.

CONTENT:
## What's Our Policy?

When a guest damages an item, you have two main options.

## Factors We Consider

- The replacement cost
- Guest track record

TAGS: damage, refunds, guest policy

CATEGORY: Guest Management

READ TIME: 3
---`;

const result = parseAlcoveDraft(sample);
console.log(JSON.stringify(result, null, 2));
// Expected: title, summary, HTML content with <h2> and <ul>, tags array, suggestedCategory, readTimeMinutes
```

Confirm the `content` field contains `<h2>`, `<ul>`, `<li>`, and `<p>` tags. Confirm `tags` is `["damage", "refunds", "guest policy"]`. Confirm `readTimeMinutes` is `3`.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/admin/help-intake-parser.ts
git commit -m "feat: add Alcove draft parser for help center intake"
```

---

## Task 2: Intake server page

**Files:**
- Create: `apps/web/src/app/(admin)/admin/help/intake/page.tsx`

Follows the exact pattern of `apps/web/src/app/(admin)/admin/help/new/page.tsx`.

- [ ] **Step 1: Create the page**

```typescript
// apps/web/src/app/(admin)/admin/help/intake/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { IntakePage } from "./IntakePage";

export const metadata: Metadata = {
  title: "New from Alcove | Help Center | Admin",
};

export default async function HelpIntakePage() {
  const service = createServiceClient();

  const { data: categories } = await service
    .from("help_categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-8">
        <div>
          <Link
            href="/admin/help"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--color-brand)" }}
          >
            &larr; Back to Help Center
          </Link>
          <h1
            className="mt-3 text-3xl font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            New from Alcove
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Paste the output from the FAQ Article Drafter prompt, review the parsed fields, then publish.
          </p>
        </div>

        <IntakePage categories={categories ?? []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/(admin)/admin/help/intake/page.tsx
git commit -m "feat: add help intake server page"
```

---

## Task 3: IntakePage client component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/help/intake/IntakePage.tsx`

This is the core of the feature. Two phases controlled by `phase` state. Phase 1 is the paste textarea. Phase 2 is the pre-filled review form.

The form calls `createArticle` (existing server action) by building a `FormData` object. The `source:ai-intake` tag is auto-appended to the tags array before submission.

- [ ] **Step 1: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/help/intake/IntakePage.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HelpArticleEditor } from "@/components/help/HelpArticleEditor";
import { parseAlcoveDraft, type ParsedDraft } from "@/lib/admin/help-intake-parser";
import { createArticle } from "../actions";

type Category = { id: string; name: string };

const fieldStyle = {
  borderColor: "var(--color-warm-gray-200)",
  backgroundColor: "var(--color-white)",
  color: "var(--color-text-primary)",
};

const labelStyle = { color: "var(--color-text-secondary)" };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function IntakePage({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"paste" | "review">("paste");
  const [rawText, setRawText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  // Review phase state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [readTime, setReadTime] = useState(5);

  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleParse() {
    const parsed = parseAlcoveDraft(rawText);
    if (!parsed) {
      setParseError(
        "Could not parse the draft. Make sure you pasted the full output from Alcove, including TITLE, SUMMARY, CONTENT, TAGS, CATEGORY, and READ TIME."
      );
      return;
    }
    setParseError(null);

    setTitle(parsed.title);
    setSlug(slugify(parsed.title));
    setSlugManual(false);
    setSummary(parsed.summary);
    setContent(parsed.content);
    setTags(parsed.tags.join(", "));
    setReadTime(parsed.readTimeMinutes);

    // Pre-select category by matching name (case-insensitive)
    const matched = categories.find(
      (c) => c.name.toLowerCase() === parsed.suggestedCategory.toLowerCase()
    );
    setCategoryId(matched?.id ?? categories[0]?.id ?? "");

    setPhase("review");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManual) setSlug(slugify(value));
  }

  function buildFormData(status: "draft" | "published"): FormData {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("slug", slug);
    fd.set("summary", summary);
    fd.set("content", content);
    fd.set("category_id", categoryId);
    // Auto-append source:ai-intake tag
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!tagList.includes("source:ai-intake")) {
      tagList.push("source:ai-intake");
    }
    fd.set("tags", tagList.join(", "));
    fd.set("read_time_minutes", String(readTime));
    fd.set("status", status);
    return fd;
  }

  function handleSave(status: "draft" | "published") {
    setSaveError(null);
    startTransition(async () => {
      try {
        await createArticle(buildFormData(status));
        router.push("/admin/help");
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save article.");
      }
    });
  }

  // ── Phase 1: Paste ────────────────────────────────────────────────────────
  if (phase === "paste") {
    return (
      <div className="flex flex-col gap-4">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={18}
          className="w-full rounded-lg border px-4 py-3 text-sm font-mono outline-none transition-colors resize-y"
          style={{ ...fieldStyle, minHeight: "320px" }}
          placeholder={`Paste the full Alcove output here, e.g.:

---
TITLE: How do we handle items damaged by guests?

SUMMARY: ...

CONTENT:
## What's Our Policy?
...

TAGS: damage, refunds, guest policy

CATEGORY: Guest Management

READ TIME: 3
---`}
        />

        {parseError && (
          <p className="text-sm" style={{ color: "var(--color-error, #dc2626)" }}>
            {parseError}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            Parse and Review
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 2: Review ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Start over */}
      <button
        onClick={() => setPhase("paste")}
        className="self-start text-sm font-medium transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        &larr; Start over
      </button>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
          style={fieldStyle}
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Slug
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}
          className="rounded-lg border px-4 py-2.5 text-sm font-mono outline-none transition-colors"
          style={fieldStyle}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
          style={fieldStyle}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Summary
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors resize-none"
          style={fieldStyle}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Content
        </label>
        <HelpArticleEditor content={content} onChange={setContent} />
      </div>

      {/* Tags + Read Time */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
            style={fieldStyle}
          />
          <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            Comma-separated. <code>source:ai-intake</code> is added automatically.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
            Read Time (minutes)
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={readTime}
            onChange={(e) => setReadTime(parseInt(e.target.value, 10) || 5)}
            className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <p className="text-sm" style={{ color: "var(--color-error, #dc2626)" }}>
          {saveError}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={() => handleSave("draft")}
          disabled={isPending || !title.trim() || !categoryId}
          className="inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
        >
          {isPending ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={() => handleSave("published")}
          disabled={isPending || !title.trim() || !categoryId}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          {isPending ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
npx tsc --noEmit
```

Expected: no errors in the new files. Fix any type errors before continuing.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/(admin)/admin/help/intake/IntakePage.tsx
git commit -m "feat: add IntakePage client component for help article intake"
```

---

## Task 4: Add "New from Alcove" button to the help list page

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/help/page.tsx`

Change the single "New Article" button in the header into a two-button group. "New from Alcove" is secondary (outlined), "New Article" is primary (brand).

- [ ] **Step 1: Replace the header button group**

Find this block in `page.tsx` (lines 78–84):

```typescript
          <Link
            href="/admin/help/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            New Article
          </Link>
```

Replace with:

```typescript
          <div className="flex items-center gap-3">
            <Link
              href="/admin/help/intake"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            >
              New from Alcove
            </Link>
            <Link
              href="/admin/help/new"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              New Article
            </Link>
          </div>
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/(admin)/admin/help/page.tsx
git commit -m "feat: add New from Alcove button to help center admin"
```

---

## Task 5: End-to-end verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web dev
```

Server runs on port 4000.

- [ ] **Step 2: Navigate to `/admin/help`**

Confirm the two-button group appears: "New from Alcove" (outlined) and "New Article" (brand blue).

- [ ] **Step 3: Click "New from Alcove" and test Phase 1**

Paste this sample draft into the textarea:

```
---
TITLE: How do we handle items damaged by guests?

SUMMARY: This article explains how The Parcel Company evaluates and responds to guest-caused property damage, including when to charge and when to absorb the cost.

CONTENT:
## What's Our Policy?

When a guest damages an item in your property, you have two options: pursue reimbursement through the platform's damage protection or absorb the cost and replace the item directly.

## Factors We Consider

- The replacement or repair cost relative to the booking value
- The guest's track record and review history
- Whether the damage affects your ability to host future guests
- The likelihood that filing a claim will trigger a negative review

## How This Affects Reviews

Filing a damage claim can sometimes prompt a retaliatory review. For low-cost items (under $50), absorbing the cost often preserves your rating more effectively than pursuing reimbursement.

TAGS: damage, refunds, guest policy, reviews

CATEGORY: Guest Management

READ TIME: 4
---
```

Click "Parse and Review". Confirm Phase 2 loads with all fields pre-filled.

- [ ] **Step 4: Verify Phase 2 fields**

Check:
- Title: "How do we handle items damaged by guests?"
- Slug: "how-do-we-handle-items-damaged-by-guests"
- Category: pre-selected to "Guest Management" (or closest match)
- Summary: pre-filled
- Content: Tiptap editor shows formatted content with headings and bullet list
- Tags: "damage, refunds, guest policy, reviews"
- Read time: 4

- [ ] **Step 5: Click "Save as Draft"**

Confirm redirect to `/admin/help`. Confirm the new article appears in the list with status "Draft" and the `source:ai-intake` tag.

- [ ] **Step 6: Open the draft and verify**

Click the article in the list → Edit. Confirm all fields are correct. Confirm tags include `source:ai-intake`.

- [ ] **Step 7: Final TypeScript check and build**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
npx tsc --noEmit
pnpm build
```

Expected: clean build, no type errors.
