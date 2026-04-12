"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return user.id;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createArticle(formData: FormData) {
  await verifyAdmin();
  const service = createServiceClient();

  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const categoryId = formData.get("category_id") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const tagsRaw = formData.get("tags") as string;
  const readTime = parseInt(formData.get("read_time_minutes") as string, 10) || 5;
  const relatedPath = (formData.get("related_portal_path") as string) || null;
  const status = (formData.get("status") as string) || "draft";

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  if (!categoryId) throw new Error("Category is required");

  const { error } = await service.from("help_articles").insert({
    title,
    slug,
    category_id: categoryId,
    summary,
    content,
    tags,
    read_time_minutes: readTime,
    related_portal_path: relatedPath,
    status: status as "draft" | "published" | "archived",
    published_at: status === "published" ? new Date().toISOString() : null,
  });

  if (error) {
    throw new Error(`Failed to create article: ${error.message}`);
  }

  revalidatePath("/admin/help");
  revalidatePath("/help");
}

export async function updateArticle(id: string, formData: FormData) {
  await verifyAdmin();
  const service = createServiceClient();

  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const categoryId = formData.get("category_id") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const tagsRaw = formData.get("tags") as string;
  const readTime = parseInt(formData.get("read_time_minutes") as string, 10) || 5;
  const relatedPath = (formData.get("related_portal_path") as string) || null;
  const status = (formData.get("status") as string) || "draft";

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // Check if transitioning to published
  const { data: existing } = await service
    .from("help_articles")
    .select("status, published_at")
    .eq("id", id)
    .single();

  const publishedAt =
    status === "published" && existing?.status !== "published"
      ? new Date().toISOString()
      : existing?.published_at ?? null;

  const { error } = await service
    .from("help_articles")
    .update({
      title,
      slug,
      category_id: categoryId || undefined,
      summary,
      content,
      tags,
      read_time_minutes: readTime,
      related_portal_path: relatedPath,
      status: status as "draft" | "published" | "archived",
      published_at: publishedAt,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update article: ${error.message}`);
  }

  revalidatePath("/admin/help");
  revalidatePath("/help");
  revalidatePath(`/help/${slug}`);
}

export async function deleteArticle(id: string) {
  await verifyAdmin();
  const service = createServiceClient();

  const { error } = await service.from("help_articles").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete article: ${error.message}`);
  }

  revalidatePath("/admin/help");
  revalidatePath("/help");
}
