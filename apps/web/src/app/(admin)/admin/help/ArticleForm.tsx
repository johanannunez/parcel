"use client";

import { useRef, useState, useTransition } from "react";
import { HelpArticleEditor } from "@/components/help/HelpArticleEditor";

type Category = { id: string; name: string };

type ArticleData = {
  title?: string;
  slug?: string;
  category_id?: string | null;
  summary?: string;
  content?: string;
  tags?: string[];
  read_time_minutes?: number;
  related_portal_path?: string | null;
  status?: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const fieldStyle = {
  borderColor: "var(--color-warm-gray-200)",
  backgroundColor: "var(--color-white)",
  color: "var(--color-text-primary)",
};

const labelStyle = { color: "var(--color-text-secondary)" };

export function ArticleForm({
  categories,
  action,
  initialData,
}: {
  categories: Category[];
  action: (formData: FormData) => Promise<void>;
  initialData?: ArticleData;
}) {
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [articleContent, setArticleContent] = useState(initialData?.content ?? "");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleTitleChange(title: string) {
    if (!slugManual) {
      setSlug(slugify(title));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(value);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Title
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={initialData?.title ?? ""}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
          style={fieldStyle}
          placeholder="How to submit a property"
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Slug
        </label>
        <input
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="rounded-lg border px-4 py-2.5 text-sm font-mono outline-none transition-colors"
          style={fieldStyle}
          placeholder="how-to-submit-a-property"
        />
      </div>

      {/* Category + Status row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
            Category
          </label>
          <select
            name="category_id"
            defaultValue={initialData?.category_id ?? ""}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
            Status
          </label>
          <select
            name="status"
            defaultValue={initialData?.status ?? "draft"}
            className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
            style={fieldStyle}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Summary
        </label>
        <textarea
          name="summary"
          rows={2}
          defaultValue={initialData?.summary ?? ""}
          className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors resize-none"
          style={fieldStyle}
          placeholder="A brief description shown in search results..."
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Content
        </label>
        <HelpArticleEditor
          content={articleContent}
          onChange={setArticleContent}
        />
        <input type="hidden" name="content" value={articleContent} />
      </div>

      {/* Tags + Read Time row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
            Tags
          </label>
          <input
            name="tags"
            type="text"
            defaultValue={initialData?.tags?.join(", ") ?? ""}
            className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
            style={fieldStyle}
            placeholder="getting-started, properties, billing"
          />
          <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            Comma-separated
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
            Read Time (minutes)
          </label>
          <input
            name="read_time_minutes"
            type="number"
            min={1}
            max={60}
            defaultValue={initialData?.read_time_minutes ?? 5}
            className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Related Portal Path */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
          Related Portal Path (optional)
        </label>
        <input
          name="related_portal_path"
          type="text"
          defaultValue={initialData?.related_portal_path ?? ""}
          className="rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
          style={fieldStyle}
          placeholder="/portal/properties"
        />
        <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
          Link this article to a portal page for contextual help
        </span>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          {isPending ? "Saving..." : initialData ? "Update Article" : "Create Article"}
        </button>
      </div>
    </form>
  );
}
