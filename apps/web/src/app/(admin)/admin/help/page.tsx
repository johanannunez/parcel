import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { HelpArticleFilter } from "./HelpArticleFilter";
import { ChangelogTab } from "./ChangelogTab";
import { fetchChangelogs } from "@/lib/admin/changelogs";

export const metadata: Metadata = {
  title: "Help Center | Admin",
};

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

export default async function AdminHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "articles" } = await searchParams;
  const service = createServiceClient();

  const { data: rawArticles } = await service
    .from("help_articles")
    .select("id, title, slug, status, view_count, helpful_count, not_helpful_count, read_time_minutes, published_at, sort_order, category_id, help_categories(name)")
    .order("sort_order", { ascending: true });

  const articles: Article[] = (rawArticles ?? []).map((a) => {
    const cat = a.help_categories as unknown as { name: string } | null;
    return {
      id: a.id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      view_count: a.view_count ?? 0,
      helpful_count: a.helpful_count ?? 0,
      not_helpful_count: a.not_helpful_count ?? 0,
      read_time_minutes: a.read_time_minutes ?? 0,
      published_at: a.published_at,
      sort_order: a.sort_order ?? 0,
      category_id: a.category_id,
      category_name: cat?.name ?? null,
    };
  });

  const sorted = [...articles].sort((a, b) => {
    const catA = a.category_name ?? "Uncategorized";
    const catB = b.category_name ?? "Uncategorized";
    if (catA !== catB) return catA.localeCompare(catB);
    return a.sort_order - b.sort_order;
  });

  const changelogs = tab === "changelog" ? await fetchChangelogs(50) : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-8">
        {/* Tab row + actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["articles", "changelog"] as const).map((t) => (
              <a
                key={t}
                href={`/admin/help?tab=${t}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  background: tab === t ? "var(--color-brand)" : "transparent",
                  color: tab === t ? "#fff" : "var(--color-text-secondary)",
                  transition: "background 120ms ease",
                  textTransform: "capitalize",
                }}
              >
                {t === "articles" ? "Articles" : "Changelog"}
              </a>
            ))}
          </div>
          {tab === "articles" && (
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
          )}
        </div>

        {tab === "articles" ? (
          <HelpArticleFilter articles={sorted} />
        ) : (
          <ChangelogTab initialEntries={changelogs} />
        )}
      </div>
    </div>
  );
}
