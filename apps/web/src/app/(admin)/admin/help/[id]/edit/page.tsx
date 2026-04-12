import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { updateArticle, deleteArticle } from "../../actions";
import { ArticleForm } from "../../ArticleForm";
import { DeleteButton } from "./DeleteButton";

export const metadata: Metadata = {
  title: "Edit Article | Admin",
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = createServiceClient();

  const [articleResult, categoriesResult] = await Promise.all([
    service.from("help_articles").select("*").eq("id", id).single(),
    service
      .from("help_categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
  ]);

  if (!articleResult.data) {
    notFound();
  }

  const article = articleResult.data;
  const categories = categoriesResult.data ?? [];

  const totalFeedback = (article.helpful_count ?? 0) + (article.not_helpful_count ?? 0);
  const helpfulPct =
    totalFeedback > 0
      ? Math.round(((article.helpful_count ?? 0) / totalFeedback) * 100)
      : null;

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateArticle(id, formData);
    redirect("/admin/help");
  }

  async function handleDelete() {
    "use server";
    await deleteArticle(id);
    redirect("/admin/help");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-8">
        {/* Back link */}
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
            Edit Article
          </h1>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-3 gap-4 rounded-xl border p-5"
          style={{ backgroundColor: "var(--color-white)" }}
        >
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Views
            </div>
            <div
              className="mt-1 text-xl font-semibold tabular-nums"
              style={{ color: "var(--color-text-primary)" }}
            >
              {(article.view_count ?? 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Helpful
            </div>
            <div
              className="mt-1 text-xl font-semibold tabular-nums"
              style={{ color: "var(--color-text-primary)" }}
            >
              {helpfulPct !== null ? `${helpfulPct}%` : "No data"}
            </div>
          </div>
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Total Feedback
            </div>
            <div
              className="mt-1 text-xl font-semibold tabular-nums"
              style={{ color: "var(--color-text-primary)" }}
            >
              {totalFeedback}
            </div>
          </div>
        </div>

        {/* Form */}
        <ArticleForm
          categories={categories}
          action={handleUpdate}
          initialData={{
            title: article.title,
            slug: article.slug,
            category_id: article.category_id,
            summary: article.summary ?? "",
            content: article.content ?? "",
            tags: (article.tags as string[] | null) ?? [],
            read_time_minutes: article.read_time_minutes ?? 5,
            related_portal_path: article.related_portal_path,
            status: article.status,
          }}
        />

        {/* Delete section */}
        <div
          className="rounded-xl border p-5"
          style={{
            borderColor: "rgba(239, 68, 68, 0.2)",
            backgroundColor: "rgba(239, 68, 68, 0.04)",
          }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Danger Zone
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Permanently delete this article. This action cannot be undone.
          </p>
          <div className="mt-4">
            <DeleteButton action={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}
