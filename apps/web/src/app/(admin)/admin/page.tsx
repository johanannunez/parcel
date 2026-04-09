import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [ownersResult, propertiesResult, inquiriesResult, blockResult, bookingsResult, payoutsResult] =
    await Promise.all([
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
      supabase
        .from("block_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("payouts")
        .select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Owners", value: ownersResult.count ?? 0, href: "/admin/owners" },
    { label: "Properties", value: propertiesResult.count ?? 0, href: "/admin/properties" },
    { label: "Bookings", value: bookingsResult.count ?? 0, href: "/admin/calendar" },
    { label: "Payouts", value: payoutsResult.count ?? 0, href: "/admin/payouts" },
  ];

  const actions = [
    {
      label: "New inquiries",
      value: inquiriesResult.count ?? 0,
      href: "/admin/inquiries",
    },
    {
      label: "Pending blocks",
      value: blockResult.count ?? 0,
      href: "/admin/block-requests",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Overview
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          A snapshot of your portfolio.
        </p>
      </div>

      {/* Main stat cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="admin-stat-card rounded-xl border p-5 transition-colors"
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {s.label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {s.value}
            </div>
          </Link>
        ))}
      </section>

      {/* Action items */}
      {(actions[0].value > 0 || actions[1].value > 0) ? (
        <section>
          <h2
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Needs attention
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {actions
              .filter((a) => a.value > 0)
              .map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl border px-5 py-4 transition-colors"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.06)",
                    borderColor: "rgba(245, 158, 11, 0.15)",
                  }}
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: "#f59e0b",
                      color: "#1a1a1a",
                    }}
                  >
                    {a.value}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    {a.label}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      ) : null}
    </div>
    </div>
  );
}
