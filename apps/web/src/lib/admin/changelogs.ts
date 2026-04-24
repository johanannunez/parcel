"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type Changelog = {
  id: string;
  title: string;
  body: string;
  version: string | null;
  tag: string | null;
  published_at: string;
  created_at: string;
};

export async function fetchChangelogs(limit = 20): Promise<Changelog[]> {
  // Cast through any: "changelogs" table not yet in generated Supabase types
  const svc = createServiceClient() as unknown as ReturnType<typeof createServiceClient> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from(table: "changelogs"): any;
  };
  const { data } = await svc
    .from("changelogs")
    .select("id, title, body, version, tag, published_at, created_at")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Changelog[];
}

export async function createChangelog(input: {
  title: string;
  body: string;
  version?: string;
  tag?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.title.trim() || !input.body.trim()) {
    return { ok: false, error: "Title and body are required." };
  }
  // Cast through any: "changelogs" table not yet in generated Supabase types
  const svc = createServiceClient() as unknown as ReturnType<typeof createServiceClient> & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from(table: "changelogs"): any;
  };
  const { error } = await svc.from("changelogs").insert({
    title: input.title.trim(),
    body: input.body.trim(),
    version: input.version?.trim() || null,
    tag: input.tag?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/help");
  return { ok: true };
}
