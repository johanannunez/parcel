import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminHomePage() {
  const supabase = await createClient();

  // Both queries run in parallel to avoid a waterfall.
  const [ownersResult, propertiesResult, inquiriesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Admin overview
        </h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
          Phase 2 scaffolding. Real admin tooling ships in Phase 3.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard
          label="Owners"
          value={String(ownersResult.count ?? 0)}
        />
        <AdminStatCard
          label="Properties"
          value={String(propertiesResult.count ?? 0)}
        />
        <AdminStatCard
          label="New inquiries"
          value={String(inquiriesResult.count ?? 0)}
        />
      </section>
    </div>
  );
}

function AdminStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--color-charcoal)",
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
