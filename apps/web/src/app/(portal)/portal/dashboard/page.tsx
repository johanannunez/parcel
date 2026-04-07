import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already redirects unauthenticated users, but we defensive-check
  // here so TypeScript knows user exists below.
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, created_at")
    .eq("id", user.id)
    .single();

  const { count: propertyCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const displayName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Welcome back, {displayName}.
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Phase 2 scaffolding is live. Real dashboard content ships in Phase 3.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Your role" value={profile?.role ?? "owner"} />
        <StatCard label="Properties" value={String(propertyCount ?? 0)} />
        <StatCard label="Signed in as" value={user.email ?? ""} />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-xl font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
