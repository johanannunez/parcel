import { createClient } from "@/lib/supabase/server";

export type PaletteScope =
  | "all"
  | "contacts"
  | "owners"
  | "properties"
  | "tasks"
  | "projects";

export type PaletteHit = {
  id: string;
  kind: "contact" | "owner" | "property" | "task" | "project";
  label: string;
  subtitle?: string;
  href: string;
};

export type PaletteSearchResponse = {
  contacts: PaletteHit[];
  owners: PaletteHit[];
  properties: PaletteHit[];
  tasks: PaletteHit[];
  projects: PaletteHit[];
};

function ilikePattern(q: string): string {
  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
  return `"%${escaped.replaceAll('"', '""')}%"`;
}

async function queryContacts(q: string, limit: number): Promise<PaletteHit[]> {
  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select("id, full_name, display_name, company_name, email");

  if (q) {
    const pattern = ilikePattern(q);
    query = query.or(
      `full_name.ilike.${pattern},display_name.ilike.${pattern},company_name.ilike.${pattern},email.ilike.${pattern}`,
    );
  }
  query = query.order("full_name", { ascending: true }).limit(limit);

  const { data } = await query;
  return (data ?? []).map((r) => {
    const name = (r.display_name?.trim() || r.full_name?.trim() || r.company_name?.trim() || r.email || "Contact") as string;
    const subtitle = r.email ?? r.company_name ?? undefined;
    return {
      id: r.id as string,
      kind: "contact",
      label: name,
      subtitle,
      href: `/admin/people/${r.id}`,
    };
  });
}

async function queryOwners(q: string, limit: number): Promise<PaletteHit[]> {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, workspace_id")
    .eq("role", "owner");

  if (q) {
    const pattern = ilikePattern(q);
    query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
  }
  query = query.order("full_name", { ascending: true }).limit(limit);

  const { data } = await query;
  return (data ?? []).map((r) => {
    const name = (r.full_name?.trim() || r.email || "Owner") as string;
    return {
      id: r.id as string,
      kind: "owner",
      label: name,
      subtitle: r.email ?? undefined,
      href: r.workspace_id ? `/admin/workspaces/${r.workspace_id}` : "/admin/workspaces?view=active-owners",
    };
  });
}

async function queryProperties(q: string, limit: number): Promise<PaletteHit[]> {
  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select("id, name, address_line1, city, state");

  if (q) {
    const pattern = ilikePattern(q);
    query = query.or(
      `name.ilike.${pattern},address_line1.ilike.${pattern},city.ilike.${pattern}`,
    );
  }
  query = query.order("address_line1", { ascending: true }).limit(limit);

  const { data } = await query;
  return (data ?? []).map((r) => {
    const label = (r.name?.trim() || r.address_line1 || "(unnamed property)") as string;
    const locality = [r.city, r.state].filter(Boolean).join(", ") || undefined;
    const subtitle = r.name?.trim() ? r.address_line1 ?? locality : locality;
    return {
      id: r.id as string,
      kind: "property",
      label,
      subtitle,
      href: `/admin/properties/${r.id}`,
    };
  });
}

async function queryTasks(q: string, limit: number): Promise<PaletteHit[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("id, title, status, due_at");

  if (q) {
    query = query.ilike("title", `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`);
  }
  query = query.order("created_at", { ascending: false }).limit(limit);

  const { data } = await query;
  return (data ?? []).map((r) => {
    const title = (r.title as string | null)?.trim() || "Untitled task";
    const status = r.status as string | null;
    return {
      id: r.id as string,
      kind: "task",
      label: title,
      subtitle: status ? `Task · ${status}` : "Task",
      href: q
        ? `/admin/tasks?q=${encodeURIComponent(q)}`
        : `/admin/tasks`,
    };
  });
}

async function queryProjects(q: string, limit: number): Promise<PaletteHit[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("id, name, status");

  if (q) {
    const pattern = ilikePattern(q);
    query = query.or(`name.ilike.${pattern}`);
  }
  query = query.order("updated_at", { ascending: false }).limit(limit);

  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind: "project",
    label: (r.name as string | null)?.trim() || "Untitled project",
    subtitle: (r.status as string | null) ?? undefined,
    href: `/admin/projects/${r.id}`,
  }));
}

export async function searchAll(
  q: string,
  perGroup = 5,
): Promise<PaletteSearchResponse> {
  const query = q.trim();
  if (!query) {
    return { contacts: [], owners: [], properties: [], tasks: [], projects: [] };
  }
  const [contacts, owners, properties, tasks, projects] = await Promise.all([
    queryContacts(query, perGroup),
    queryOwners(query, perGroup),
    queryProperties(query, perGroup),
    queryTasks(query, perGroup),
    queryProjects(query, perGroup),
  ]);
  return { contacts, owners, properties, tasks, projects };
}

export async function listScope(
  scope: PaletteScope,
  limit = 10,
): Promise<PaletteHit[]> {
  switch (scope) {
    case "contacts":
      return queryContacts("", limit);
    case "owners":
      return queryOwners("", limit);
    case "properties":
      return queryProperties("", limit);
    case "tasks":
      return queryTasks("", limit);
    case "projects":
      return queryProjects("", limit);
    case "all":
    default:
      return [];
  }
}
