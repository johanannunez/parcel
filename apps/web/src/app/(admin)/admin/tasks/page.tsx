// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — tasks tables not yet in generated Supabase types
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminTasksShell } from "./AdminTasksShell";

export const metadata: Metadata = { title: "Tasks (Admin)" };
export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const supabase = await createClient();

  const [
    tasksResult,
    ownersResult,
    propertiesResult,
    labelsResult,
    templatesResult,
    allProfilesResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(`
        id, title, description, task_type, status, priority,
        due_date, due_time, property_id, owner_id, created_by,
        created_at, updated_at, completed_at, sort_order,
        task_assignees(profile_id, profiles:profiles(id, full_name, avatar_url)),
        task_label_map(label_id, task_labels:task_labels(id, name, color)),
        task_subtasks(id, title, completed, sort_order)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "owner")
      .order("full_name", { ascending: true }),
    supabase
      .from("properties")
      .select("id, address_line1, city, state")
      .order("address_line1", { ascending: true }),
    supabase
      .from("task_labels")
      .select("id, name, color")
      .order("name", { ascending: true }),
    supabase
      .from("task_templates")
      .select("id, name, description, category, task_type, subtasks, default_priority, due_offset_days, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .order("full_name", { ascending: true }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTasks = (tasksResult.data ?? []) as any[];
  const tasks = rawTasks.map((t) => ({
    id: t.id as string,
    title: t.title as string,
    description: t.description as string | null,
    task_type: t.task_type as string,
    status: t.status as string,
    priority: t.priority as string,
    due_date: t.due_date as string | null,
    due_time: t.due_time as string | null,
    property_id: t.property_id as string | null,
    owner_id: t.owner_id as string | null,
    created_at: t.created_at as string,
    completed_at: t.completed_at as string | null,
    sort_order: t.sort_order as number | null,
    assignees: (t.task_assignees ?? []).map((a: { profile_id: string; profiles: { id: string; full_name: string | null; avatar_url: string | null } | null }) => ({
      profile_id: a.profile_id,
      name: a.profiles?.full_name ?? "Unknown",
      avatar_url: a.profiles?.avatar_url ?? null,
    })),
    labels: (t.task_label_map ?? []).map((m: { label_id: string; task_labels: { id: string; name: string; color: string } | null }) => ({
      id: m.label_id,
      name: m.task_labels?.name ?? "",
      color: m.task_labels?.color ?? "#6B7280",
    })),
    subtasks: (t.task_subtasks ?? []).map((s: { id: string; title: string; completed: boolean; sort_order: number }) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
      sort_order: s.sort_order,
    })),
  }));

  const owners = (ownersResult.data ?? []).map((o) => ({
    id: o.id,
    full_name: o.full_name,
    email: o.email,
    avatar_url: o.avatar_url,
  }));

  const properties = (propertiesResult.data ?? []).map((p) => ({
    id: p.id,
    address_line1: p.address_line1,
    city: p.city,
    state: p.state,
  }));

  const labels = (labelsResult.data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templates = (templatesResult.data ?? []).map((t: any) => ({
    id: t.id as string,
    name: t.name as string,
    description: t.description as string | null,
    category: t.category as string | null,
    task_type: t.task_type as string,
    subtasks: (t.subtasks ?? []) as { title: string }[],
    default_priority: (t.default_priority ?? "medium") as string,
  }));

  const allProfiles = (allProfilesResult.data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    avatar_url: p.avatar_url,
  }));

  return (
    <div className="w-full">
      <AdminTasksShell
        tasks={tasks}
        owners={owners}
        properties={properties}
        labels={labels}
        templates={templates}
        allProfiles={allProfiles}
      />
    </div>
  );
}
