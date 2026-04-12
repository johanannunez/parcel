import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Bank,
  CheckCircle,
  ArrowRight,
  Buildings,
  CreditCard,
  PiggyBank,
  Plugs,
} from "@phosphor-icons/react/dist/ssr";
import { isTreasuryVerified } from "@/lib/treasury/auth";
import { createClient } from "@/lib/supabase/server";
import { getAccounts, getConnectionStatus } from "@/lib/treasury/queries";
import { currency0 } from "@/lib/format";
import { ACTIVE_BUCKET_CATEGORIES } from "@/lib/treasury/types";
import PlaidLinkButton from "./PlaidLinkButton";
import AccountCategorizer from "./AccountCategorizer";
import { disconnectBank } from "./actions";

export const metadata: Metadata = {
  title: "Accounts | Treasury | Admin",
};

const ACTIVE_BUCKET_SET = new Set<string>(ACTIVE_BUCKET_CATEGORIES);

const BUCKET_LABELS: Record<string, string> = {
  income: "Income",
  owners_comp: "Owner's Comp",
  tax: "Tax Reserve",
  emergency: "Emergency Fund",
  opex: "Operating Expenses",
  profit: "Profit",
  generosity: "Generosity",
  growth: "Growth",
  cleaners: "Cleaners",
  yearly: "Yearly",
  disbursement: "Disbursement",
  deposits: "Deposits",
  uncategorized: "Uncategorized",
};

type AccountRow = {
  id: string;
  name: string;
  type: string;
  current_balance: number;
  available_balance: number | null;
  bucket_category: string | null;
  allocation_target_pct: number | null;
  is_active: boolean;
  mask: string | null;
};

type ConnectionRow = {
  id: string;
  institution_name: string | null;
  status: string;
  last_synced_at: string | null;
};

async function getStripeMonthlyTotals(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("treasury_transactions")
    .select("amount, category")
    .gte("date", startDate)
    .lt("date", endDate)
    .eq("source", "stripe")
    .in("category", ["stripe_fee", "stripe_payout"])
    .eq("is_duplicate", false) as { data: Array<{ amount: number; category: string }> | null };

  const rows = data ?? [];
  const techFee = rows
    .filter((r) => r.category === "stripe_fee")
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const payout = rows
    .filter((r) => r.category === "stripe_payout")
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);

  return { techFee, payout };
}

export default async function TreasuryAccountsPage() {
  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury/accounts");
  }

  const supabase = await createClient();

  const [rawAccounts, connection, stripe] = await Promise.all([
    getAccounts(supabase),
    getConnectionStatus(supabase) as Promise<ConnectionRow | null>,
    getStripeMonthlyTotals(supabase),
  ]);

  const accounts = rawAccounts as AccountRow[];

  // Split into active buckets vs uncategorized vs other
  const activeBuckets = accounts.filter(
    (a) => a.bucket_category && ACTIVE_BUCKET_SET.has(a.bucket_category)
  );
  const uncategorizedAccounts = accounts.filter(
    (a) => !a.bucket_category || a.bucket_category === "uncategorized"
  );
  const otherAccounts = accounts.filter(
    (a) =>
      a.bucket_category &&
      a.bucket_category !== "uncategorized" &&
      !ACTIVE_BUCKET_SET.has(a.bucket_category)
  );

  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  const syncedAt = connection?.last_synced_at
    ? new Date(connection.last_synced_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>

        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-text-primary)",
              }}
            >
              Accounts
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "var(--color-text-tertiary)",
              }}
            >
              {accounts.length > 0
                ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""} · ${currency0.format(totalBalance)} total`
                : "No accounts linked yet"}
            </p>
          </div>

          {/* Connection status badge */}
          {connection ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1.5px solid rgba(22,163,74,0.2)",
                backgroundColor: "rgba(22,163,74,0.06)",
              }}
            >
              <CheckCircle size={16} weight="fill" color="#16a34a" />
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  {connection.institution_name ?? "Bank connected"}
                </div>
                {syncedAt && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    Synced {syncedAt}
                  </div>
                )}
              </div>
              <form
                action={async () => {
                  "use server";
                  await disconnectBank(connection.id);
                  redirect("/admin/treasury/accounts");
                }}
                style={{ marginLeft: "8px" }}
              >
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "7px",
                    border: "1.5px solid rgba(220,38,38,0.2)",
                    backgroundColor: "rgba(220,38,38,0.06)",
                    color: "#b91c1c",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Plugs size={13} weight="bold" />
                  Disconnect
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {/* No connection — empty state with Plaid Link */}
        {!connection && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              padding: "64px 24px",
              textAlign: "center",
              borderRadius: "20px",
              border: "1.5px dashed rgba(2,170,235,0.3)",
              backgroundColor: "rgba(2,170,235,0.03)",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(2,170,235,0.12), rgba(27,119,190,0.12))",
                border: "1.5px solid rgba(2,170,235,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bank size={36} weight="duotone" color="#1B77BE" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text-primary)",
                }}
              >
                No bank connected
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "var(--color-text-secondary)",
                  maxWidth: "360px",
                }}
              >
                Connect a bank account via Plaid to start syncing balances and
                transactions across your treasury buckets.
              </p>
            </div>

            <PlaidLinkButton />
          </div>
        )}

        {/* Categorization banner + controls for uncategorized accounts */}
        {uncategorizedAccounts.length > 0 && (
          <AccountCategorizer
            accounts={uncategorizedAccounts.map((a) => ({
              id: a.id,
              name: a.name,
              mask: a.mask,
              type: a.type,
            }))}
          />
        )}

        {/* Active Buckets */}
        {activeBuckets.length > 0 && (
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              Active Buckets
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
              }}
              className="treasury-accounts-grid"
            >
              {activeBuckets.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </section>
        )}

        {/* Other Accounts */}
        {otherAccounts.length > 0 && (
          <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              Other Accounts
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                opacity: 0.72,
              }}
              className="treasury-accounts-grid"
            >
              {otherAccounts.map((account) => (
                <AccountCard key={account.id} account={account} dimmed />
              ))}
            </div>
          </section>
        )}

        {/* Stripe Revenue section */}
        {connection && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              Stripe Revenue · {monthLabel}
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {[
                {
                  label: "Tech Fee Collected",
                  value: currency0.format(stripe.techFee),
                  icon: <CreditCard size={20} weight="duotone" color="#1B77BE" />,
                  accent: "rgba(2,170,235,0.07)",
                  border: "rgba(2,170,235,0.18)",
                },
                {
                  label: "Stripe Payouts",
                  value: currency0.format(stripe.payout),
                  icon: <ArrowRight size={20} weight="duotone" color="#16a34a" />,
                  accent: "rgba(22,163,74,0.07)",
                  border: "rgba(22,163,74,0.18)",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    backgroundColor: card.accent,
                    border: `1.5px solid ${card.border}`,
                    borderRadius: "14px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9px",
                      backgroundColor: "var(--color-white)",
                      border: `1px solid ${card.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-text-tertiary)",
                        marginBottom: "4px",
                      }}
                    >
                      {card.label}
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {card.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width: 1024px) {
          .treasury-accounts-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .treasury-accounts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function AccountCard({
  account,
  dimmed = false,
}: {
  account: AccountRow;
  dimmed?: boolean;
}) {
  const isSavings = account.type === "savings";
  const bucketLabel = account.bucket_category
    ? (BUCKET_LABELS[account.bucket_category] ?? account.bucket_category)
    : null;

  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        border: "1.5px solid var(--color-warm-gray-200)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        transition: "box-shadow 0.15s ease",
      }}
    >
      {/* Header row: account icon + type badge */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: dimmed
              ? "rgba(0,0,0,0.04)"
              : "linear-gradient(135deg, rgba(2,170,235,0.1), rgba(27,119,190,0.1))",
            border: dimmed ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(2,170,235,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isSavings ? (
            <PiggyBank size={18} weight="duotone" color={dimmed ? "var(--color-warm-gray-400)" : "#1B77BE"} />
          ) : (
            <Buildings size={18} weight="duotone" color={dimmed ? "var(--color-warm-gray-400)" : "#1B77BE"} />
          )}
        </div>

        {/* Type badge */}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "3px 8px",
            borderRadius: "20px",
            backgroundColor: isSavings ? "rgba(217,119,6,0.08)" : "rgba(2,170,235,0.08)",
            color: isSavings ? "#b45309" : "#1B77BE",
            border: `1px solid ${isSavings ? "rgba(217,119,6,0.15)" : "rgba(2,170,235,0.15)"}`,
          }}
        >
          {isSavings ? "Savings" : "Checking"}
        </span>
      </div>

      {/* Account name + mask */}
      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--color-text-primary)",
            lineHeight: 1.3,
            marginBottom: "2px",
          }}
        >
          {account.name}
        </div>
        {account.mask && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-text-tertiary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ···· {account.mask}
          </div>
        )}
      </div>

      {/* Balance — large number */}
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            marginBottom: "4px",
          }}
        >
          Current Balance
        </div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--color-text-primary)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {currency0.format(account.current_balance ?? 0)}
        </div>
        {account.available_balance !== null &&
          account.available_balance !== account.current_balance && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-text-tertiary)",
                marginTop: "3px",
              }}
            >
              {currency0.format(account.available_balance)} available
            </div>
          )}
      </div>

      {/* Footer: bucket label + allocation target */}
      {(bucketLabel || account.allocation_target_pct !== null) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            paddingTop: "12px",
            borderTop: "1px solid var(--color-warm-gray-100)",
          }}
        >
          {bucketLabel && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: dimmed ? "var(--color-text-tertiary)" : "var(--color-text-secondary)",
              }}
            >
              {bucketLabel}
            </span>
          )}
          {account.allocation_target_pct !== null && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "20px",
                backgroundColor: "rgba(2,170,235,0.08)",
                color: "#1B77BE",
                marginLeft: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {account.allocation_target_pct}% target
            </span>
          )}
        </div>
      )}
    </div>
  );
}
