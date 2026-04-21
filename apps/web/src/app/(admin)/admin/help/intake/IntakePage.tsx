"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HelpArticleEditor } from "@/components/help/HelpArticleEditor";
import { parseAlcoveDraft } from "@/lib/admin/help-intake-parser";
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
        setSaveError(
          err instanceof Error ? err.message : "Failed to save article."
        );
      }
    });
  }

  // Phase 1: Paste
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

  // Phase 2: Review
  return (
    <div className="flex flex-col gap-6">
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
