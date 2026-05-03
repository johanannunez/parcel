import "server-only";
import { createClient } from "@/lib/supabase/server";

export type OverviewTask = {
  id: string;
  title: string;
  dueAt: string | null;
  status: string;
};

export async function fetchWorkspaceContactOpenTasks(contactId: string): Promise<OverviewTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_at, status")
    .eq("parent_type", "contact")
    .eq("parent_id", contactId)
    .neq("status", "done")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(5);

  if (error) {
    console.error("[workspace-overview] tasks fetch error:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    dueAt: r.due_at ?? null,
    status: r.status,
  }));
}
