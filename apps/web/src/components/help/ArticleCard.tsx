import Link from "next/link";
import { Clock } from "@phosphor-icons/react/dist/ssr";

export function ArticleCard({
  title,
  slug,
  summary,
  categorySlug,
  categoryName,
  readTimeMinutes,
  tags,
  basePath = "/help",
}: {
  title: string;
  slug: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  readTimeMinutes: number;
  tags?: string[];
  basePath?: string;
}) {
  return (
    <Link
      href={`${basePath}/${categorySlug}/${slug}`}
      className="group relative flex flex-col gap-3 rounded-2xl border p-6 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] active:translate-y-0"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Hover shadow overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          boxShadow:
            "0 12px 28px -8px rgba(0, 0, 0, 0.08), 0 4px 10px -4px rgba(0, 0, 0, 0.04)",
        }}
      />

      {/* Header: category badge + read time */}
      <div className="relative flex items-center gap-3">
        <span
          className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "rgba(2, 170, 235, 0.08)",
            color: "var(--color-brand)",
          }}
        >
          {categoryName}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[11px]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <Clock size={12} weight="duotone" />
          {readTimeMinutes} min read
        </span>
      </div>

      {/* Title */}
      <h3
        className="relative text-[15px] font-semibold leading-snug tracking-tight transition-colors duration-150 group-hover:text-[var(--color-brand)]"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h3>

      {/* Summary */}
      <p
        className="relative line-clamp-2 text-sm leading-relaxed"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {summary}
      </p>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="relative flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-tertiary)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
