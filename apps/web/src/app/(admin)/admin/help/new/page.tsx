import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { createArticle } from "../actions";
import { ArticleForm } from "../ArticleForm";

export const metadata: Metadata = {
  title: "New Article | Admin",
};

export default async function NewArticlePage() {
  const service = createServiceClient();

  const { data: categories } = await service
    .from("help_categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  async function handleCreate(formData: FormData) {
    "use server";
    await createArticle(formData);
    redirect("/admin/help");
  }

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
            New Article
          </h1>
        </div>

        <ArticleForm
          categories={categories ?? []}
          action={handleCreate}
        />
      </div>
    </div>
  );
}
