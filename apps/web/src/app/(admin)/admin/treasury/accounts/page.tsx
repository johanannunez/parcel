import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Bank,
  Buildings,
  CreditCard as CreditCardIcon,
  PiggyBank,
  ChartLine,
} from "@phosphor-icons/react/dist/ssr";
import { isTreasuryVerified } from "@/lib/treasury/auth";
import { createClient } from "@/lib/supabase/server";
import { getAccounts, getAllConnections } from "@/lib/treasury/queries";
import { currency0 } from "@/lib/format";
import PlaidLinkButton from "./PlaidLinkButton";
import AccountCategorizer from "./AccountCategorizer";
import RemoveAccountButton from "./RemoveAccountButton";
import BalanceChartLoader from "@/components/admin/treasury/BalanceChartLoader";
import { SyncButton } from "@/components/admin/treasury/SyncButton";
import CollapsibleSection from "./CollapsibleSection";

export const metadata: Metadata = {
  title: "Accounts | Treasury | Admin",
};

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

const ACCOUNT_TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  iconSmall: React.ReactNode;
  color: string;
  isLiability: boolean;
}> = {
  checking: {
    label: "Cash",
    icon: <Buildings size={14} weight="duotone" color="#1B77BE" />,
    iconSmall: <Buildings size={12} weight="duotone" color="#1B77BE" />,
    color: "#16a34a",
    isLiability: false,
  },
  savings: {
    label: "Savings",
    icon: <PiggyBank size={14} weight="duotone" color="#d97706" />,
    iconSmall: <PiggyBank size={12} weight="duotone" color="#d97706" />,
    color: "#60a5fa",
    isLiability: false,
  },
  credit_card: {
    label: "Credit Cards",
    icon: <CreditCardIcon size={14} weight="duotone" color="#dc2626" />,
    iconSmall: <CreditCardIcon size={12} weight="duotone" color="#dc2626" />,
    color: "#dc2626",
    isLiability: true,
  },
  investment: {
    label: "Investments",
    icon: <ChartLine size={14} weight="duotone" color="#7c3aed" />,
    iconSmall: <ChartLine size={12} weight="duotone" color="#7c3aed" />,
    color: "#7c3aed",
    isLiability: false,
  },
  loan: {
    label: "Loans",
    icon: <Bank size={14} weight="duotone" color="#dc2626" />,
    iconSmall: <Bank size={12} weight="duotone" color="#dc2626" />,
    color: "#f87171",
    isLiability: true,
  },
};

const CATEGORY_ORDER = ["checking", "savings", "investment", "credit_card", "loan"];

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
  connection_id: string | null;
};

type ConnectionRow = {
  id: string;
  institution_name: string | null;
  status: string;
  last_synced_at: string | null;
};

export default async function TreasuryAccountsPage() {
  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury/accounts");
  }

  const supabase = await createClient();

  const [rawAccounts, connections] = await Promise.all([
    getAccounts(supabase),
    getAllConnections(supabase) as Promise<ConnectionRow[]>,
  ]);

  const accounts = rawAccounts as AccountRow[];
  const hasConnections = connections.length > 0;

  const latestSync = connections.reduce<string | null>((latest, conn) => {
    if (!conn.last_synced_at) return latest;
    if (!latest) return conn.last_synced_at;
    return conn.last_synced_at > latest ? conn.last_synced_at : latest;
  }, null);

  // Group accounts by type
  const accountsByType = new Map<string, AccountRow[]>();
  const uncategorizedAccounts: AccountRow[] = [];

  for (const account of accounts) {
    if (!account.bucket_category || account.bucket_category === "uncategorized") {
      uncategorizedAccounts.push(account);
    }
    const typeKey = account.type ?? "checking";
    if (!accountsByType.has(typeKey)) accountsByType.set(typeKey, []);
    accountsByType.get(typeKey)!.push(account);
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  // Category totals for summary
  const categoryTotals: Array<{
    type: string; label: string; total: number; count: number; color: string; isLiability: boolean;
  }> = [];
  for (const typeKey of CATEGORY_ORDER) {
    const typeAccounts = accountsByType.get(typeKey);
    if (!typeAccounts || typeAccounts.length === 0) continue;
    const config = ACCOUNT_TYPE_CONFIG[typeKey] ?? ACCOUNT_TYPE_CONFIG.checking;
    const total = typeAccounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
    categoryTotals.push({
      type: typeKey, label: config.label, total, count: typeAccounts.length,
      color: config.color, isLiability: config.isLiability,
    });
  }

  const totalAssets = categoryTotals.filter((c) => !c.isLiability).reduce((sum, c) => sum + c.total, 0);
  const totalLiabilities = categoryTotals.filter((c) => c.isLiability).reduce((sum, c) => sum + Math.abs(c.total), 0);

  // Connection map
  const connectionMap = new Map<string, ConnectionRow>();
  for (const conn of connections) connectionMap.set(conn.id, conn);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px 24px 40px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <h1 style={{
            margin: 0, fontSize: "18px", fontWeight: 700,
            letterSpacing: "-0.02em", color: "var(--color-text-primary)",
          }}>
            Accounts
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {hasConnections && <SyncButton lastSyncedAt={latestSync} />}
            <PlaidLinkButton />
          </div>
        </div>

        {/* Chart */}
        {hasConnections && <BalanceChartLoader currentBalance={totalBalance} />}

        {/* Empty state */}
        {!hasConnections && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
            padding: "48px 24px", textAlign: "center", borderRadius: "10px",
            border: "1px dashed rgba(2,170,235,0.3)", backgroundColor: "rgba(2,170,235,0.03)",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(2,170,235,0.12), rgba(27,119,190,0.12))",
              border: "1px solid rgba(2,170,235,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bank size={28} weight="duotone" color="#1B77BE" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h2 style={{
                margin: 0, fontSize: "16px", fontWeight: 700,
                letterSpacing: "-0.02em", color: "var(--color-text-primary)",
              }}>No bank connected</h2>
              <p style={{
                margin: 0, fontSize: "13px", lineHeight: "1.5",
                color: "var(--color-text-secondary)", maxWidth: "320px",
              }}>
                Connect a bank account via Plaid to start syncing balances and transactions.
              </p>
            </div>
            <PlaidLinkButton />
          </div>
        )}

        {/* Uncategorized banner */}
        {uncategorizedAccounts.length > 0 && (
          <AccountCategorizer accounts={uncategorizedAccounts.map((a) => ({
            id: a.id, name: a.name, mask: a.mask, type: a.type,
          }))} />
        )}

        {/* Two-column layout: categories left, summary right */}
        {hasConnections && (
          <div className="treasury-two-col">
            {/* Left: account categories */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {CATEGORY_ORDER.map((typeKey) => {
                const typeAccounts = accountsByType.get(typeKey);
                if (!typeAccounts || typeAccounts.length === 0) return null;
                const config = ACCOUNT_TYPE_CONFIG[typeKey] ?? ACCOUNT_TYPE_CONFIG.checking;
                const typeTotal = typeAccounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

                return (
                  <CollapsibleSection
                    key={typeKey}
                    label={config.label}
                    total={currency0.format(Math.abs(typeTotal))}
                    isLiability={config.isLiability}
                  >
                    {typeAccounts.map((account, idx) => {
                      const conn = account.connection_id ? connectionMap.get(account.connection_id) : null;
                      return (
                        <AccountListRow
                          key={account.id}
                          account={account}
                          institutionName={conn?.institution_name ?? null}
                          isFirst={idx === 0}
                          isLast={idx === typeAccounts.length - 1}
                          isLiability={config.isLiability}
                        />
                      );
                    })}
                  </CollapsibleSection>
                );
              })}
            </div>

            {/* Right: sticky summary */}
            <div className="treasury-summary-col">
              <SummarySidebar
                categoryTotals={categoryTotals}
                totalAssets={totalAssets}
                totalLiabilities={totalLiabilities}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .treasury-two-col {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 16px;
          align-items: start;
        }
        .treasury-summary-col {
          position: sticky;
          top: 72px;
        }
        @media (max-width: 1024px) {
          .treasury-two-col {
            grid-template-columns: 1fr;
          }
          .treasury-summary-col {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Summary Sidebar                                                     */
/* ------------------------------------------------------------------ */

function SummarySidebar({
  categoryTotals,
  totalAssets,
  totalLiabilities,
}: {
  categoryTotals: Array<{ type: string; label: string; total: number; color: string; isLiability: boolean }>;
  totalAssets: number;
  totalLiabilities: number;
}) {
  const assetCategories = categoryTotals.filter((c) => !c.isLiability);
  const liabilityCategories = categoryTotals.filter((c) => c.isLiability);

  return (
    <div style={{
      backgroundColor: "var(--color-white)",
      border: "1px solid var(--color-warm-gray-200)",
      borderRadius: "8px",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid var(--color-warm-gray-100)",
      }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Summary
        </span>
        <div style={{ display: "flex", gap: "0px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px",
            backgroundColor: "var(--color-warm-gray-100)", color: "var(--color-text-primary)",
          }}>Totals</span>
          <span style={{
            fontSize: "11px", fontWeight: 500, padding: "3px 8px",
            color: "var(--color-text-tertiary)",
          }}>Percent</span>
        </div>
      </div>

      {/* Assets */}
      {totalAssets > 0 && (
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>Assets</span>
            <span style={{
              fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}>{currency0.format(totalAssets)}</span>
          </div>

          {/* Stacked bar */}
          <div style={{
            display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden",
            backgroundColor: "var(--color-warm-gray-100)", marginBottom: "10px",
          }}>
            {assetCategories.map((cat) => (
              <div key={cat.type} style={{
                width: `${totalAssets > 0 ? (cat.total / totalAssets) * 100 : 0}%`,
                backgroundColor: cat.color,
                minWidth: "2px",
              }} />
            ))}
          </div>

          {/* Category rows */}
          {assetCategories.map((cat) => (
            <div key={cat.type} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "4px 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  backgroundColor: cat.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  {cat.label}
                </span>
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)",
                fontVariantNumeric: "tabular-nums",
              }}>{currency0.format(cat.total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Liabilities */}
      {totalLiabilities > 0 && (
        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--color-warm-gray-100)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>Liabilities</span>
            <span style={{
              fontSize: "13px", fontWeight: 700, color: "#dc2626",
              fontVariantNumeric: "tabular-nums",
            }}>{currency0.format(totalLiabilities)}</span>
          </div>

          {/* Red bar */}
          <div style={{
            height: "6px", borderRadius: "3px", overflow: "hidden",
            backgroundColor: "var(--color-warm-gray-100)", marginBottom: "10px",
          }}>
            <div style={{ width: "100%", height: "100%", backgroundColor: "#dc2626" }} />
          </div>

          {liabilityCategories.map((cat) => (
            <div key={cat.type} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "4px 0",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  backgroundColor: cat.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  {cat.label}
                </span>
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 600, color: "#dc2626",
                fontVariantNumeric: "tabular-nums",
              }}>{currency0.format(Math.abs(cat.total))}</span>
            </div>
          ))}
        </div>
      )}

      {/* Download CSV */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid var(--color-warm-gray-100)",
      }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#02AAEB", cursor: "pointer" }}>
          Download CSV
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Account list row — tightened to match Monarch                       */
/* ------------------------------------------------------------------ */

function AccountListRow({
  account,
  institutionName,
  isFirst,
  isLast,
  isLiability,
}: {
  account: AccountRow;
  institutionName: string | null;
  isFirst: boolean;
  isLast: boolean;
  isLiability: boolean;
}) {
  const config = ACCOUNT_TYPE_CONFIG[account.type] ?? ACCOUNT_TYPE_CONFIG.checking;
  const bucketLabel = account.bucket_category
    ? (BUCKET_LABELS[account.bucket_category] ?? account.bucket_category)
    : null;

  return (
    <div style={{
      backgroundColor: "var(--color-white)",
      border: "1px solid var(--color-warm-gray-200)",
      borderTop: isFirst ? undefined : "none",
      borderRadius: isFirst && isLast ? "0 0 8px 8px"
        : isFirst ? "0"
        : isLast ? "0 0 8px 8px"
        : "0",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}>
      {/* Icon */}
      <div style={{
        width: "28px", height: "28px", borderRadius: "7px",
        background: `${config.color}10`,
        border: `1px solid ${config.color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {config.icon}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)",
          letterSpacing: "-0.01em", lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {account.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "1px" }}>
          {institutionName && (
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
              {institutionName}
            </span>
          )}
          {account.mask && (
            <>
              {institutionName && <span style={{ fontSize: "11px", color: "var(--color-warm-gray-300)" }}>·</span>}
              <span style={{
                fontSize: "11px", color: "var(--color-text-tertiary)",
                fontVariantNumeric: "tabular-nums",
              }}>
                ···{account.mask}
              </span>
            </>
          )}
          {bucketLabel && (
            <>
              <span style={{ fontSize: "11px", color: "var(--color-warm-gray-300)" }}>·</span>
              <span style={{
                fontSize: "10px", fontWeight: 600, padding: "0px 5px",
                borderRadius: "3px", backgroundColor: "rgba(2,170,235,0.08)", color: "#1B77BE",
              }}>{bucketLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Balance */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em",
          color: isLiability ? "#dc2626" : "var(--color-text-primary)",
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>
          {isLiability && account.current_balance > 0 ? "-" : ""}
          {currency0.format(Math.abs(account.current_balance ?? 0))}
        </div>
      </div>

      {/* Remove (compact) */}
      <RemoveAccountButton accountId={account.id} accountName={account.name} />
    </div>
  );
}
