"use client";

import { useState } from "react";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { formatMedium } from "@/lib/format";

type Article = {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  read_time_minutes: number;
  published_at: string | null;
  sort_order: number;
  category_id: string | null;
  category_name: string | null;
};

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: "rgba(245, 158, 11, 0.12)", color: "#b45309", label: "Draft" },
  published: { bg: "rgba(34, 197, 94, 0.12)", color: "#15803d", label: "Published" },
  archived: { bg: "rgba(148, 163, 184, 0.12)", color: "#64748b", label: "Archived" },
};

export function HelpArticleFilter({ articles }: { articles: Article[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          (a.category_name ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : articles;

  return (
    <>
      {/* Search input */}
      <div className="relative">
        <MagnifyingGlass
          weight="duotone"
          className="absolute left-3 top-1/2 -translate-y-1/2"
          size={18}
          style={{ color: "var(--color-text-secondary)" }}
        />
        <input
          type="text"
          placeholder="Filter articles by title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: "var(--color-white)" }}
      >
        {filtered.length === 0 ? (
          <div
            className="px-5 py-12 text-center text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {search ? "No articles match your filter" : "No articles yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="border-b text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    borderColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Views</th>
                  <th className="px-5 py-3 text-right font-semibold">Helpful %</th>
                  <th className="px-5 py-3 text-right font-semibold">Read Time</th>
                  <th className="px-5 py-3 font-semibold">Published</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((article) => {
                  const totalFeedback = article.helpful_count + article.not_helpful_count;
                  const helpfulPct =
                    totalFeedback > 0
                      ? Math.round((article.helpful_count / totalFeedback) * 100)
                      : null;
                  const style = statusStyles[article.status] ?? statusStyles.draft;

                  return (
                    <tr
                      key={article.id}
                      className="border-b transition-colors last:border-b-0 hover:bg-[var(--color-warm-gray-50)]"
                      style={{ borderColor: "var(--color-warm-gray-100)" }}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/help/${article.id}/edit`}
                          className="font-medium transition-colors hover:underline"
                          style={{ color: "var(--color-brand)" }}
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {article.category_name ?? "Uncategorized"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 text-right tabular-nums"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {article.view_count.toLocaleString()}
                      </td>
                      <td
                        className="px-5 py-3.5 text-right tabular-nums"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {helpfulPct !== null ? `${helpfulPct}%` : "\u2014"}
                      </td>
                      <td
                        className="px-5 py-3.5 text-right tabular-nums"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {article.read_time_minutes} min
                      </td>
                      <td
                        className="px-5 py-3.5"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {article.published_at
                          ? formatMedium(article.published_at)
                          : "\u2014"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
