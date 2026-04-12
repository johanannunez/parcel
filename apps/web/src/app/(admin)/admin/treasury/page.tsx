import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bank,
  ArrowUp,
  ArrowDown,
  Equals,
  Warning,
  CheckCircle,
  Coins,
  PiggyBank,
} from "@phosphor-icons/react/dist/ssr";
import { isTreasuryVerified } from "@/lib/treasury/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getAccounts,
  getConnectionStatus,
  getAlerts,
  getSavingsGoals,
  getMonthlyTotals,
  calculateAllocationHealth,
} from "@/lib/treasury/queries";
import { currency0 } from "@/lib/format";

export const metadata: Metadata = {
  title: "Treasury | Admin",
};

const CATEGORY_LABELS: Record<string, string> = {
  owners_comp: "Owner's Comp",
  tax: "Tax",
  emergency: "Emergency",
  opex: "OPEX",
  profit: "Profit",
  generosity: "Generosity",
};

const STATUS_COLORS = {
  on_track: { bar: "#16a34a", badge: "rgba(22,163,74,0.1)", text: "#15803d" },
  drifting: { bar: "#d97706", badge: "rgba(217,119,6,0.1)", text: "#b45309" },
  off_track: { bar: "#dc2626", badge: "rgba(220,38,38,0.1)", text: "#b91c1c" },
};

const ALERT_SEVERITY_STYLES = {
  info: { border: "rgba(2,170,235,0.2)", bg: "rgba(2,170,235,0.05)", dot: "#02AAEB" },
  warning: { border: "rgba(217,119,6,0.2)", bg: "rgba(217,119,6,0.05)", dot: "#d97706" },
  critical: { border: "rgba(220,38,38,0.2)", bg: "rgba(220,38,38,0.05)", dot: "#dc2626" },
};

export default async function TreasuryOverviewPage() {
  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury");
  }

  const supabase = await createClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [connection, accounts, alerts, savingsGoals, monthly] = await Promise.all([
    getConnectionStatus(supabase),
    getAccounts(supabase),
    getAlerts(supabase, 10),
    getSavingsGoals(supabase),
    getMonthlyTotals(supabase, year, month),
  ]);

  // No bank connected — show empty state
  if (!connection) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            textAlign: "center",
            maxWidth: "400px",
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
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-text-primary)",
              }}
            >
              Connect your bank
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.6",
                color: "var(--color-text-secondary)",
              }}
            >
              Link a bank account to start tracking cash flow, allocation health,
              and savings progress.
            </p>
          </div>
          <Link
            href="/admin/treasury/accounts"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #02AAEB, #1B77BE)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(2,170,235,0.3)",
            }}
          >
            Connect Bank Account
          </Link>
        </div>
      </div>
    );
  }

  const allocationHealth = calculateAllocationHealth(
    accounts as Array<{
      bucket_category: string;
      current_balance: number;
      allocation_target_pct: number | null;
      is_active: boolean;
    }>
  );

  const totalCash = accounts.reduce(
    (sum: number, a: { current_balance: number }) => sum + a.current_balance,
    0
  );

  const syncedAt = connection.last_synced_at
    ? new Date(connection.last_synced_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const unacknowledgedAlerts = (alerts as Array<{ acknowledged_at: string | null; severity: string; message: string; alert_type: string; id: string }>).filter(
    (a) => !a.acknowledged_at
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Header */}
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
              Treasury
            </h1>
            {syncedAt && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "var(--color-text-tertiary)",
                }}
              >
                Last synced {syncedAt}
              </p>
            )}
          </div>
          {/* Sync Now placeholder — wired up in a future task */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1.5px solid var(--color-warm-gray-200)",
              backgroundColor: "var(--color-white)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              cursor: "default",
              opacity: 0.6,
            }}
            aria-label="Sync Now (coming soon)"
          >
            Sync Now
          </div>
        </div>

        {/* Stat cards */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              label: "Total Cash",
              value: currency0.format(totalCash),
              icon: <Coins size={20} weight="duotone" color="#1B77BE" />,
              accent: "rgba(2,170,235,0.08)",
              borderColor: "rgba(2,170,235,0.15)",
            },
            {
              label: "Monthly Income",
              value: currency0.format(monthly.income),
              icon: <ArrowUp size={20} weight="duotone" color="#16a34a" />,
              accent: "rgba(22,163,74,0.07)",
              borderColor: "rgba(22,163,74,0.15)",
            },
            {
              label: "Monthly Expenses",
              value: currency0.format(monthly.expenses),
              icon: <ArrowDown size={20} weight="duotone" color="#dc2626" />,
              accent: "rgba(220,38,38,0.06)",
              borderColor: "rgba(220,38,38,0.13)",
            },
            {
              label: "Net Profit",
              value: currency0.format(monthly.net),
              icon: <Equals size={20} weight="duotone" color={monthly.net >= 0 ? "#16a34a" : "#dc2626"} />,
              accent: monthly.net >= 0 ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.06)",
              borderColor: monthly.net >= 0 ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.13)",
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                backgroundColor: card.accent,
                border: `1.5px solid ${card.borderColor}`,
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  backgroundColor: "var(--color-white)",
                  border: `1px solid ${card.borderColor}`,
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
                    fontSize: "22px",
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
        </section>

        {/* Two-column: Allocation Health + Savings Goals */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Allocation Health */}
          <section
            style={{
              backgroundColor: "var(--color-white)",
              border: "1.5px solid var(--color-warm-gray-200)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid var(--color-warm-gray-100)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--color-text-primary)",
                }}
              >
                Allocation Health
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "var(--color-text-tertiary)",
                }}
              >
                Actual vs. profit-first targets
              </p>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {allocationHealth.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "var(--color-text-tertiary)",
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No allocation data yet
                </p>
              ) : (
                allocationHealth.map((item) => {
                  const colors = STATUS_COLORS[item.status];
                  const label = CATEGORY_LABELS[item.category] ?? item.category;
                  return (
                    <div key={item.category} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {label}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {item.actual_pct}%
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            / {item.target_pct}%
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: "20px",
                              backgroundColor: colors.badge,
                              color: colors.text,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {item.status === "on_track" ? "On track" : item.status === "drifting" ? "Drifting" : "Off track"}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar track */}
                      <div
                        style={{
                          height: "6px",
                          borderRadius: "99px",
                          backgroundColor: "var(--color-warm-gray-100)",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        {/* Actual fill */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: `${Math.min(item.actual_pct, 100)}%`,
                            borderRadius: "99px",
                            backgroundColor: colors.bar,
                            transition: "width 0.4s ease",
                          }}
                        />
                        {/* Target marker */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: `${Math.min(item.target_pct, 100)}%`,
                            width: "2px",
                            backgroundColor: "rgba(0,0,0,0.18)",
                            borderRadius: "1px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Savings Goals */}
          <section
            style={{
              backgroundColor: "var(--color-white)",
              border: "1.5px solid var(--color-warm-gray-200)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid var(--color-warm-gray-100)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--color-text-primary)",
                }}
              >
                Savings Goals
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "var(--color-text-tertiary)",
                }}
              >
                Active goals and progress
              </p>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {(savingsGoals as Array<{
                id: string;
                name: string;
                target_amount: number;
                treasury_accounts: { current_balance: number; name: string } | null;
              }>).length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  <PiggyBank size={28} weight="duotone" color="var(--color-warm-gray-300)" />
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    No active savings goals
                  </p>
                </div>
              ) : (
                (savingsGoals as Array<{
                  id: string;
                  name: string;
                  target_amount: number;
                  treasury_accounts: { current_balance: number; name: string } | null;
                }>).map((goal) => {
                  const current = goal.treasury_accounts?.current_balance ?? 0;
                  const pct = goal.target_amount > 0
                    ? Math.min((current / goal.target_amount) * 100, 100)
                    : 0;
                  const rounded = Math.round(pct * 10) / 10;
                  const complete = pct >= 100;
                  return (
                    <div key={goal.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {goal.name}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {currency0.format(current)}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                            / {currency0.format(goal.target_amount)}
                          </span>
                          {complete && (
                            <CheckCircle size={14} weight="fill" color="#16a34a" />
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          borderRadius: "99px",
                          backgroundColor: "var(--color-warm-gray-100)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${rounded}%`,
                            borderRadius: "99px",
                            background: complete
                              ? "#16a34a"
                              : "linear-gradient(90deg, #02AAEB, #1B77BE)",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-tertiary)",
                          textAlign: "right",
                        }}
                      >
                        {rounded}% funded
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Alerts */}
        {unacknowledgedAlerts.length > 0 && (
          <section>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              Alerts
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {unacknowledgedAlerts.map((alert) => {
                const sev = (alert.severity ?? "info") as keyof typeof ALERT_SEVERITY_STYLES;
                const style = ALERT_SEVERITY_STYLES[sev] ?? ALERT_SEVERITY_STYLES.info;
                return (
                  <div
                    key={alert.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: `1.5px solid ${style.border}`,
                      backgroundColor: style.bg,
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: style.dot,
                        marginTop: "5px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          lineHeight: "1.4",
                        }}
                      >
                        {alert.message}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-tertiary)",
                          textTransform: "capitalize",
                        }}
                      >
                        {alert.alert_type?.replace(/_/g, " ")}
                      </span>
                    </div>
                    {sev === "warning" || sev === "critical" ? (
                      <Warning
                        size={16}
                        weight="duotone"
                        color={style.dot}
                        style={{ flexShrink: 0, marginTop: "2px", marginLeft: "auto" }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
