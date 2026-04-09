import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inquiries (Admin)",
};
export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const supabase = await createClient();

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select(
      "id, full_name, email, phone, property_type, property_address, property_count, message, status, source, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const newCount = (inquiries ?? []).filter((i) => i.status === "new").length;
  const contactedCount = (inquiries ?? []).filter(
    (i) => i.status === "contacted",
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Inquiries
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Property management leads from the website.
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4">
        <StatCard label="Total inquiries" value={String((inquiries ?? []).length)} />
        <StatCard label="New (uncontacted)" value={String(newCount)} />
        <StatCard label="Contacted" value={String(contactedCount)} />
      </section>

      {/* Table */}
      {(inquiries ?? []).length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center text-sm"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-tertiary)",
          }}
        >
          No inquiries yet.
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-warm-gray-50)" }}>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Property type</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {inquiries!.map((inq) => (
                <tr
                  key={inq.id}
                  className="border-t"
                  style={{ borderColor: "var(--color-warm-gray-100)" }}
                >
                  <Td>
                    <div className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {inq.full_name}
                    </div>
                    {inq.phone ? (
                      <div
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {inq.phone}
                      </div>
                    ) : null}
                  </Td>
                  <Td>{inq.email}</Td>
                  <Td>
                    {inq.property_type ? (
                      <span className="uppercase">
                        {inq.property_type}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-tertiary)" }}>
                        Not specified
                      </span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={inq.status} />
                  </Td>
                  <Td>
                    {new Date(inq.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={{ color: "var(--color-text-tertiary)" }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      className="px-4 py-3 text-sm"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    new: { bg: "rgba(2, 170, 235, 0.12)", text: "#7dd3fc" },
    contacted: { bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24" },
    qualified: { bg: "rgba(22, 163, 74, 0.12)", text: "#4ade80" },
    won: { bg: "rgba(22, 163, 74, 0.12)", text: "#4ade80" },
    lost: { bg: "rgba(220, 38, 38, 0.12)", text: "#f87171" },
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
