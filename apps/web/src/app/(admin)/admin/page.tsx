import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";
import { getShowTestData } from "@/lib/admin/test-data";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const showTestData = await getShowTestData();

  const ownersQ = supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "owner");

  const propsQ = supabase
    .from("properties")
    .select("*", { count: "exact", head: true });

  const filteredOwnersQ = showTestData ? ownersQ : ownersQ.not('id', 'like', '0000%');
  const filteredPropsQ = showTestData ? propsQ : propsQ.not('id', 'like', '0000%');

  const [ownersResult, propertiesResult, inquiriesResult, blockResult, bookingsResult, payoutsResult, timelineResult, allProfilesResult] =
    await Promise.all([
      filteredOwnersQ,
      filteredPropsQ,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("owner_timeline")
        .select("id, owner_id, title, category, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "owner"),
    ]);

  const stats = [
    { label: "Owners", value: ownersResult.count ?? 0, href: "/admin/owners" },
    { label: "Properties", value: propertiesResult.count ?? 0, href: "/admin/properties" },
    { label: "Bookings", value: bookingsResult.count ?? 0, href: "/admin/calendar" },
    { label: "Payouts", value: payoutsResult.count ?? 0, href: "/admin/payouts" },
  ];

  const timelineEntries = (timelineResult.data ?? []) as {
    id: string;
    owner_id: string;
    title: string;
    category: string;
    created_at: string;
  }[];

  const profileMap = new Map<string, string>();
  for (const p of (allProfilesResult.data ?? []) as { id: string; full_name: string | null }[]) {
    profileMap.set(p.id, p.full_name || "Unknown");
  }

  const actions = [
    {
      label: "New inquiries",
      value: inquiriesResult.count ?? 0,
      href: "/admin/leads",
    },
    {
      label: "Reservations to verify",
      value: blockResult.count ?? 0,
      href: "/admin/block-requests",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Dashboard
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
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
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {s.label}
            </div>
            <div className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
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
            style={{ color: "var(--color-text-tertiary)" }}
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
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {a.label}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      {/* Recent Activity */}
      <section>
        <h2
          className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Recent Activity
        </h2>
        <div
          className="overflow-hidden rounded-xl border"
          style={{ backgroundColor: "var(--color-white)" }}
        >
          {timelineEntries.length === 0 ? (
            <div
              className="px-5 py-8 text-center text-sm"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              No timeline activity yet
            </div>
          ) : (
            <>
              <ul className="divide-y" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                {timelineEntries.map((entry) => {
                  const ownerName = profileMap.get(entry.owner_id) || "Unknown";
                  const initials = ownerName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: "rgba(27, 119, 190, 0.1)",
                          color: "var(--color-brand)",
                        }}
                      >
                        {initials}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className="shrink-0 text-xs font-medium"
                          style={{ color: "var(--color-brand)" }}
                        >
                          {ownerName}
                        </span>
                        <span
                          className="truncate text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {entry.title}
                        </span>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{
                          backgroundColor: "var(--color-warm-gray-100)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {entry.category}
                      </span>
                      <span
                        className="shrink-0 text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {formatRelative(entry.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div
                className="border-t px-5 py-3"
                style={{ borderColor: "var(--color-warm-gray-100)" }}
              >
                <Link
                  href="/admin/timeline"
                  className="text-xs font-medium"
                  style={{ color: "var(--color-brand)" }}
                >
                  View all
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
    </div>
  );
}
