"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Json } from "@/types/supabase";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "properties", label: "Properties" },
  { key: "calendar", label: "Calendar" },
  { key: "payouts", label: "Payouts" },
  { key: "setup", label: "Setup" },
  { key: "messages", label: "Messages" },
  { key: "documents", label: "Documents" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Property = {
  id: string;
  name: string | null;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  active: boolean;
  hospitable_property_id: string | null;
  setup_status: string;
  created_at: string;
};

type Booking = {
  id: string;
  property_id: string;
  propertyLabel: string;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  source: string;
  status: string;
  total_amount: number | null;
  currency: string;
};

type Payout = {
  id: string;
  property_id: string;
  propertyLabel: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  fees: number;
  net_payout: number;
  paid_at: string | null;
};

type BlockRequest = {
  id: string;
  property_id: string;
  propertyLabel: string;
  start_date: string;
  end_date: string;
  note: string | null;
  status: string;
  created_at: string;
};

export function OwnerHubTabs({
  activeTab,
  ownerId,
  properties,
  bookings,
  payouts,
  blockRequests,
  setupData,
}: {
  activeTab: string;
  ownerId: string;
  properties: Property[];
  bookings: Booking[];
  payouts: Payout[];
  blockRequests: BlockRequest[];
  setupData: Json | null;
}) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) || activeTab || "dashboard";

  return (
    <div>
      {/* Tab bar */}
      <nav
        className="-mx-8 -mt-8 mb-8 flex gap-0 overflow-x-auto border-b px-8"
        style={{ borderColor: "var(--color-warm-gray-200)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={`/admin/owners/${ownerId}?tab=${t.key}`}
              scroll={false}
              className="relative shrink-0 px-4 pb-3 pt-4 text-sm font-medium transition-colors"
              style={{
                color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              }}
            >
              {t.label}
              {active ? (
                <span
                  className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                  style={{ backgroundColor: "var(--color-brand-light)" }}
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Tab content */}
      {tab === "dashboard" && (
        <DashboardTab
          properties={properties}
          bookings={bookings}
          payouts={payouts}
          blockRequests={blockRequests}
        />
      )}
      {tab === "properties" && <PropertiesTab properties={properties} />}
      {tab === "calendar" && (
        <CalendarTab bookings={bookings} blockRequests={blockRequests} />
      )}
      {tab === "payouts" && <PayoutsTab payouts={payouts} />}
      {tab === "setup" && (
        <SetupTab properties={properties} setupData={setupData} />
      )}
      {tab === "messages" && <PlaceholderTab title="Messages" description="In-portal messaging is coming soon. Owners will be able to message you directly from their dashboard." />}
      {tab === "documents" && <PlaceholderTab title="Documents" description="Document management is coming soon. You'll be able to view and manage agreements, W9s, and other owner documents here." />}
    </div>
  );
}

/* ─── Dashboard Tab ─── */
function DashboardTab({
  properties,
  bookings,
  payouts,
  blockRequests,
}: {
  properties: Property[];
  bookings: Booking[];
  payouts: Payout[];
  blockRequests: BlockRequest[];
}) {
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.check_in) >= new Date(),
  ).length;
  const totalRevenue = payouts.reduce((sum, p) => sum + p.gross_revenue, 0);
  const lastPayout = payouts.find((p) => p.paid_at);
  const pendingBlocks = blockRequests.filter(
    (br) => br.status === "pending",
  ).length;

  const stats = [
    { label: "Properties", value: String(properties.length) },
    { label: "Upcoming bookings", value: String(upcomingBookings) },
    {
      label: "Total revenue",
      value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "$0",
    },
    {
      label: "Last payout",
      value: lastPayout?.paid_at
        ? new Date(lastPayout.paid_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "None",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {pendingBlocks > 0 ? (
        <div
          className="rounded-xl border px-5 py-4"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.06)",
            borderColor: "rgba(245, 158, 11, 0.15)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            {pendingBlocks} pending block {pendingBlocks === 1 ? "request" : "requests"}
          </span>
        </div>
      ) : null}

      {/* Recent bookings */}
      {bookings.length > 0 ? (
        <section>
          <SectionLabel>Recent bookings</SectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            {bookings.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {b.guest_name || "Guest"}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {b.propertyLabel} · {formatDateRange(b.check_in, b.check_out)}
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={b.status} />
                  {b.total_amount ? (
                    <div
                      className="mt-1 text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      ${b.total_amount.toLocaleString()}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* ─── Properties Tab ─── */
function PropertiesTab({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState message="This owner has no properties yet." />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {properties.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-lg border px-5 py-4"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {p.name?.trim() || p.address_line1}
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {p.city}, {p.state} {p.postal_code}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={p.active ? "active" : "inactive"} />
            {p.hospitable_property_id ? (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: "rgba(2, 170, 235, 0.12)",
                  color: "#0ea5e9",
                }}
              >
                Connected
              </span>
            ) : null}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-tertiary)",
              }}
            >
              {p.setup_status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Calendar Tab ─── */
function CalendarTab({
  bookings,
  blockRequests,
}: {
  bookings: Booking[];
  blockRequests: BlockRequest[];
}) {
  const upcoming = bookings.filter(
    (b) => new Date(b.check_out) >= new Date(),
  );
  const pendingBlocks = blockRequests.filter((br) => br.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      {/* Upcoming bookings */}
      <section>
        <SectionLabel>Upcoming bookings ({upcoming.length})</SectionLabel>
        {upcoming.length === 0 ? (
          <EmptyState message="No upcoming bookings." />
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {upcoming.slice(0, 10).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {b.guest_name || "Guest"}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {b.propertyLabel} · {formatDateRange(b.check_in, b.check_out)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                    style={{
                      backgroundColor: "var(--color-warm-gray-100)",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {b.source.replace(/_/g, " ")}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Block requests */}
      <section>
        <SectionLabel>Block requests ({blockRequests.length})</SectionLabel>
        {blockRequests.length === 0 ? (
          <EmptyState message="No block requests." />
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {blockRequests.map((br) => (
              <div
                key={br.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {br.propertyLabel}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {formatDateRange(br.start_date, br.end_date)}
                    {br.note ? ` · ${br.note}` : ""}
                  </div>
                </div>
                <StatusBadge status={br.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─── Payouts Tab ─── */
function PayoutsTab({ payouts }: { payouts: Payout[] }) {
  if (payouts.length === 0) {
    return <EmptyState message="No payouts recorded yet." />;
  }

  const totalGross = payouts.reduce((s, p) => s + p.gross_revenue, 0);
  const totalFees = payouts.reduce((s, p) => s + p.fees, 0);
  const totalNet = payouts.reduce((s, p) => s + p.net_payout, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Gross revenue" value={`$${totalGross.toLocaleString()}`} />
        <StatCard label="Total fees" value={`$${totalFees.toLocaleString()}`} />
        <StatCard label="Net payouts" value={`$${totalNet.toLocaleString()}`} />
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--color-warm-gray-200)" }}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--color-warm-gray-50)" }}>
              <Th>Period</Th>
              <Th>Property</Th>
              <Th align="right">Gross</Th>
              <Th align="right">Fees</Th>
              <Th align="right">Net</Th>
              <Th align="right">Paid</Th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr
                key={p.id}
                className="border-t"
                style={{ borderColor: "var(--color-warm-gray-100)" }}
              >
                <Td>
                  {formatDate(p.period_start)} - {formatDate(p.period_end)}
                </Td>
                <Td>{p.propertyLabel}</Td>
                <Td align="right">${p.gross_revenue.toLocaleString()}</Td>
                <Td align="right">${p.fees.toLocaleString()}</Td>
                <Td align="right" className="font-medium text-[var(--color-text-primary)]">
                  ${p.net_payout.toLocaleString()}
                </Td>
                <Td align="right">
                  {p.paid_at ? (
                    <span style={{ color: "#16a34a" }}>
                      {formatDate(p.paid_at)}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-text-tertiary)" }}>
                      Pending
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Setup Tab ─── */
function SetupTab({
  properties,
  setupData,
}: {
  properties: Property[];
  setupData: Json | null;
}) {
  const setupSteps = [
    "basics",
    "address",
    "space",
    "amenities",
    "rules",
    "wifi",
    "financial",
    "recommendations",
    "cleaning",
    "photos",
    "compliance",
    "identity",
    "payout",
    "host-agreement",
    "review",
  ];

  // Parse setup data if available
  const draft = setupData && typeof setupData === "object" && !Array.isArray(setupData)
    ? (setupData as Record<string, unknown>)
    : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Setup draft status */}
      {draft ? (
        <section>
          <SectionLabel>Onboarding progress</SectionLabel>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {setupSteps.map((step) => {
              const hasData = draft[step] != null;
              return (
                <div
                  key={step}
                  className="rounded-lg border px-3 py-2 text-center"
                  style={{
                    backgroundColor: hasData
                      ? "rgba(22, 163, 74, 0.08)"
                      : "var(--color-warm-gray-50)",
                    borderColor: hasData
                      ? "rgba(22, 163, 74, 0.2)"
                      : "var(--color-warm-gray-200)",
                  }}
                >
                  <div
                    className="text-[10px] font-semibold capitalize"
                    style={{
                      color: hasData ? "#16a34a" : "var(--color-text-tertiary)",
                    }}
                  >
                    {step.replace(/-/g, " ")}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState message="No setup draft data found for this owner." />
      )}

      {/* Property setup status */}
      <section>
        <SectionLabel>Property setup status</SectionLabel>
        {properties.length === 0 ? (
          <EmptyState message="No properties." />
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {properties.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {p.name?.trim() || p.address_line1}
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                  style={{
                    backgroundColor:
                      p.setup_status === "complete"
                        ? "rgba(22, 163, 74, 0.12)"
                        : "var(--color-warm-gray-100)",
                    color:
                      p.setup_status === "complete"
                        ? "#16a34a"
                        : "var(--color-text-tertiary)",
                  }}
                >
                  {p.setup_status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ─── Placeholder Tab ─── */
function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
      <p
        className="mt-2 max-w-sm text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {description}
      </p>
    </div>
  );
}

/* ─── Shared Components ─── */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: "var(--color-text-tertiary)" }}
    >
      {children}
    </h3>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    active: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    approved: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    completed: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    pending: { bg: "rgba(245, 158, 11, 0.12)", text: "#b45309" },
    cancelled: { bg: "rgba(220, 38, 38, 0.12)", text: "#dc2626" },
    declined: { bg: "rgba(220, 38, 38, 0.12)", text: "#dc2626" },
    inactive: { bg: "var(--color-warm-gray-100)", text: "var(--color-text-tertiary)" },
  };

  const c = colors[status] ?? {
    bg: "var(--color-warm-gray-100)",
    text: "var(--color-text-tertiary)",
  };

  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="mt-3 rounded-xl border p-8 text-center text-sm"
      style={{
        borderColor: "var(--color-warm-gray-200)",
        color: "var(--color-text-tertiary)",
      }}
    >
      {message}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color: "var(--color-text-tertiary)",
        textAlign: align,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
  style: overrideStyle,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td
      className={`px-4 py-3 text-sm ${className}`}
      style={{
        color: "var(--color-text-secondary)",
        textAlign: align,
        ...overrideStyle,
      }}
    >
      {children}
    </td>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}
