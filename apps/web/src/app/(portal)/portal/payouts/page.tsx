import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  DownloadSimple,
  CalendarBlank,
  CurrencyDollar,
  Clock,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { EmptyState } from "@/components/portal/EmptyState";
import { currency0, formatLong, formatShort } from "@/lib/format";

export const metadata: Metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

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
    (properties ?? []).map((p) => [p.id, p.name?.trim() || p.address_line1]),
  );

  const rows = payouts ?? [];
  const year = new Date().getFullYear();

  const ytd = rows
    .filter((r) => new Date(r.period_start).getFullYear() === year)
    .reduce((s, r) => s + Number(r.net_payout), 0);
  const pending = rows
    .filter((r) => !r.paid_at)
    .reduce((s, r) => s + Number(r.net_payout), 0);
  // Most recently *paid* payout, sorted by paid_at desc — not period_start.
  const lastPaid = rows
    .filter((r) => !!r.paid_at)
    .sort(
      (a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime(),
    )[0];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Finances"
        title="Payouts"
        description="Your earnings, period by period. Download a statement any time."
        actions={
          <Link
            href={`/api/payouts/export?year=${year}`}
            download
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--color-white)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-warm-gray-200)",
            }}
          >
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            Download {year} statement
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<CurrencyDollar size={18} weight="duotone" />}
          tone="success"
          label={`${year} earnings`}
          value={currency0.format(ytd)}
          hint="Year to date, net"
        />
        <SummaryCard
          icon={<Clock size={18} weight="duotone" />}
          tone="amber"
          label="Pending"
          value={currency0.format(pending)}
          hint="Awaiting transfer"
        />
        <SummaryCard
          icon={<CheckCircle size={18} weight="duotone" />}
          tone="brand"
          label="Last payout"
          value={
            lastPaid ? currency0.format(Number(lastPaid.net_payout)) : "—"
          }
          hint={
            lastPaid?.paid_at
              ? formatLong(lastPaid.paid_at)
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
        <>
          {/* Mobile: stacked cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div
                      className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      Period
                    </div>
                    <div
                      className="mt-1 text-sm font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {formatShort(r.period_start)} to {formatShort(r.period_end)}
                    </div>
                    <div
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {propName.get(r.property_id) ?? "Property"}
                    </div>
                  </div>
                  <StatusChip paid={!!r.paid_at} />
                </div>
                <dl
                  className="mt-4 grid grid-cols-3 gap-3 border-t pt-4"
                  style={{ borderColor: "var(--color-warm-gray-100)" }}
                >
                  <Mini label="Gross" value={currency0.format(Number(r.gross_revenue))} />
                  <Mini label="Fees" value={currency0.format(Number(r.fees))} />
                  <Mini label="Net" value={currency0.format(Number(r.net_payout))} emphasized />
                </dl>
              </li>
            ))}
          </ul>

          {/* Tablet+ : full table */}
          <section
            className="hidden overflow-hidden rounded-2xl border md:block"
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
                      className="transition-colors hover:bg-[var(--color-warm-gray-50)]"
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
                          <CalendarBlank
                            size={14}
                            weight="duotone"
                            aria-hidden="true"
                          />
                          {formatShort(r.period_start)} to {formatShort(r.period_end)}
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
                        {currency0.format(Number(r.gross_revenue))}
                      </td>
                      <td
                        className="px-6 py-4 text-right tabular-nums"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {currency0.format(Number(r.fees))}
                      </td>
                      <td
                        className="px-6 py-4 text-right font-semibold tabular-nums"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {currency0.format(Number(r.net_payout))}
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip paid={!!r.paid_at} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatusChip({ paid }: { paid: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: paid
          ? "rgba(22, 163, 74, 0.12)"
          : "rgba(245, 158, 11, 0.14)",
        color: paid ? "#15803d" : "#b45309",
      }}
    >
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

function Mini({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-sm tabular-nums"
        style={{
          color: emphasized
            ? "var(--color-text-primary)"
            : "var(--color-text-secondary)",
          fontWeight: emphasized ? 600 : 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: "brand" | "success" | "amber";
  label: string;
  value: string;
  hint: string;
}) {
  const toneMap = {
    brand: { bg: "rgba(2, 170, 235, 0.10)", fg: "#0c6fae" },
    success: { bg: "rgba(22, 163, 74, 0.10)", fg: "#15803d" },
    amber: { bg: "rgba(245, 158, 11, 0.12)", fg: "#b45309" },
  };
  const t = toneMap[tone];
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: t.bg, color: t.fg }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {label}
        </span>
      </div>
      <div>
        <div
          className="text-[32px] font-semibold leading-none tracking-tight tabular-nums"
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
    </div>
  );
}
