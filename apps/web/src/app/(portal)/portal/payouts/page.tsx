import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  DownloadSimple,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { EmptyState } from "@/components/portal/EmptyState";

export const metadata: Metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function PayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: properties }, { data: payouts }] = await Promise.all([
    supabase.from("properties").select("id, name, address_line1"),
    supabase
      .from("payouts")
      .select(
        "id, property_id, period_start, period_end, gross_revenue, fees, net_payout, paid_at, created_at",
      )
      .order("period_start", { ascending: false }),
  ]);

  const propName = new Map<string, string>(
    (properties ?? []).map((p) => [
      p.id,
      p.name?.trim() || p.address_line1,
    ]),
  );

  const rows = payouts ?? [];
  const year = new Date().getFullYear();

  const ytd = rows
    .filter((r) => new Date(r.period_start).getFullYear() === year)
    .reduce((s, r) => s + Number(r.net_payout), 0);
  const pending = rows
    .filter((r) => !r.paid_at)
    .reduce((s, r) => s + Number(r.net_payout), 0);
  const lastPaid = rows.find((r) => r.paid_at);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Finances"
        title="Payouts"
        description="Your earnings, period by period. Download a statement any time."
        actions={
          <Link
            href={`/api/payouts/export?year=${year}`}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--color-white)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-warm-gray-200)",
            }}
          >
            <DownloadSimple size={16} weight="bold" />
            Download {year} statement
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label={`${year} earnings`}
          value={currency.format(ytd)}
          hint="Year to date, net"
        />
        <SummaryCard
          label="Pending"
          value={currency.format(pending)}
          hint="Awaiting transfer"
        />
        <SummaryCard
          label="Last payout"
          value={
            lastPaid
              ? currency.format(Number(lastPaid.net_payout))
              : "—"
          }
          hint={
            lastPaid?.paid_at
              ? new Date(lastPaid.paid_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "Nothing transferred yet"
          }
        />
      </section>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Wallet size={26} weight="duotone" />}
          title="No payouts yet"
          body="Once a reservation completes, your payout period opens automatically. You will see every breakdown here."
        />
      ) : (
        <section
          className="overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Fees</th>
                  <th className="px-6 py-3 text-right">Net</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderTop:
                        i === 0
                          ? undefined
                          : "1px solid var(--color-warm-gray-100)",
                    }}
                  >
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-2 font-medium tabular-nums"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        <CalendarBlank size={14} weight="duotone" />
                        {fmt(r.period_start)} to {fmt(r.period_end)}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {propName.get(r.property_id) ?? "Property"}
                    </td>
                    <td
                      className="px-6 py-4 text-right tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {currency.format(Number(r.gross_revenue))}
                    </td>
                    <td
                      className="px-6 py-4 text-right tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {currency.format(Number(r.fees))}
                    </td>
                    <td
                      className="px-6 py-4 text-right font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {currency.format(Number(r.net_payout))}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: r.paid_at
                            ? "rgba(22, 163, 74, 0.12)"
                            : "rgba(245, 158, 11, 0.14)",
                          color: r.paid_at ? "#15803d" : "#b45309",
                        }}
                      >
                        {r.paid_at ? "Paid" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-[32px] font-semibold leading-none tracking-tight tabular-nums"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </div>
      <div
        className="mt-2 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {hint}
      </div>
    </div>
  );
}
