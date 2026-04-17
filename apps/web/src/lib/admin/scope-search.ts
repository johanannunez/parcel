import { createClient } from "@/lib/supabase/server";

export type ScopeResult =
  | { kind: "owner"; id: string; displayName: string; initials: string; sub?: string }
  | { kind: "property"; id: string; displayName: string; initials: string; sub?: string };

/**
 * Returns up to `limit` matches across owner profiles and properties for use
 * in the CreateModal ScopePicker. Admin-only — the calling API route enforces
 * the role check; this function assumes an authenticated admin.
 *
 * Properties match against `name` (optional nickname), `address_line1`, and
 * `city`. Display prefers `name` when present, otherwise falls back to
 * `address_line1`. The sub-line is composed from `city`, `state`.
 */
export async function searchScopeTargets(query: string, limit = 10): Promise<ScopeResult[]> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return [];

  // Escape `%` and `_` that might appear in user input so they are treated as
  // literal characters by ILIKE rather than wildcards.
  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;

  const [owners, properties] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "owner")
      .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from("properties")
      .select("id, name, address_line1, city, state")
      .or(`name.ilike.${pattern},address_line1.ilike.${pattern},city.ilike.${pattern}`)
      .limit(limit),
  ]);

  const results: ScopeResult[] = [];

  for (const row of owners.data ?? []) {
    const name = (row.full_name?.trim() || row.email || "Owner") as string;
    results.push({
      kind: "owner",
      id: row.id,
      displayName: name,
      initials: toInitials(name),
      sub: row.email ?? undefined,
    });
  }

  for (const row of properties.data ?? []) {
    // Prefer nickname when provided, fall back to street address.
    const displayName = row.name?.trim() || row.address_line1 || "(unnamed property)";
    const city = row.city ?? "";
    const state = row.state ?? "";
    const sub = [city, state].filter(Boolean).join(", ") || undefined;
    results.push({
      kind: "property",
      id: row.id,
      displayName,
      initials: toInitials(displayName),
      sub,
    });
  }

  return results;
}

function toInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
