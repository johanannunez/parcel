import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Payouts (Admin)",
};
export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const supabase = await createClient();

  const { data: payouts } = await supabase
    .from("payouts")
    .select(
      "id, property_id, period_start, period_end, gross_revenue, fees, net_payout, paid_at",
    )
    .order("period_start", { ascending: false })
    .limit(100);

  // Get property + owner info
  const propertyIds = [
    ...new Set((payouts ?? []).map((p) => p.property_id)),
  ];
  const { data: props } = propertyIds.length
    ? await supabase
        .from("properties")
        .select("id, name, address_line1, owner_id")
        .in("id", propertyIds)
    : { data: [] };

  const ownerIds = [...new Set((props ?? []).map((p) => p.owner_id))];
  const { data: owners } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds)
    : { data: [] };

  const ownerMap = new Map(
    (owners ?? []).map((o) => [o.id, o.full_name?.trim() || o.email]),
  );
  const propMap = new Map(
    (props ?? []).map((p) => [
      p.id,
      {
        label: p.name?.trim() || p.address_line1 || "Property",
        ownerName: ownerMap.get(p.owner_id) ?? "Unknown",
      },
    ]),
  );

  const totalGross = (payouts ?? []).reduce((s, p) => s + p.gross_revenue, 0);
  const totalFees = (payouts ?? []).reduce((s, p) => s + p.fees, 0);
  const totalNet = (payouts ?? []).reduce((s, p) => s + p.net_payout, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Payouts
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          All payout records across every owner and property.
        </p>
      </div>

      {/* Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Gross revenue" value={`$${totalGross.toLocaleString()}`} />
        <StatCard label="Total fees" value={`$${totalFees.toLocaleString()}`} />
        <StatCard label="Net payouts" value={`$${totalNet.toLocaleString()}`} />
      </section>

      {/* Table */}
      {(payouts ?? []).length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center text-sm"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-tertiary)",
          }}
        >
          No payouts recorded yet.
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-warm-gray-50)" }}>
                <Th>Owner</Th>
                <Th>Property</Th>
                <Th>Period</Th>
                <Th align="right">Gross</Th>
                <Th align="right">Fees</Th>
                <Th align="right">Net</Th>
                <Th align="right">Paid</Th>
              </tr>
            </thead>
            <tbody>
              {payouts!.map((p) => {
                const prop = propMap.get(p.property_id);
                return (
                  <tr
                    key={p.id}
                    className="border-t"
                    style={{ borderColor: "var(--color-warm-gray-100)" }}
                  >
                    <Td>{prop?.ownerName ?? "Unknown"}</Td>
                    <Td>{prop?.label ?? "Property"}</Td>
                    <Td>
                      {formatDate(p.period_start)} - {formatDate(p.period_end)}
                    </Td>
                    <Td align="right">
                      ${p.gross_revenue.toLocaleString()}
                    </Td>
                    <Td align="right">${p.fees.toLocaleString()}</Td>
                    <Td align="right" bold>
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
                );
              })}
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
      style={{ color: "var(--color-text-tertiary)", textAlign: align }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  bold = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  bold?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 text-sm ${bold ? "font-medium" : ""}`}
      style={{
        color: bold ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        textAlign: align,
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
