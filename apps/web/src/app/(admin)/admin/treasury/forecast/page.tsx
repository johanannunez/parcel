import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ChartLine,
  ArrowUp,
  ArrowDown,
  Equals,
  TrendUp,
  TrendDown,
  ArrowsLeftRight,
  Database,
} from "@phosphor-icons/react/dist/ssr";
import { isTreasuryVerified } from "@/lib/treasury/auth";
import { currency0 } from "@/lib/format";
import { getLatestForecast } from "./actions";
import ForecastShell from "./ForecastShell";

export const metadata: Metadata = {
  title: "Forecast | Treasury | Admin",
};

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Confidence styling
// ---------------------------------------------------------------------------

const CONFIDENCE_STYLES = {
  low: {
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
    dot: "#d97706",
    text: "#b45309",
    label: "Low confidence",
    hint: "Less than 3 months of data",
  },
  medium: {
    bg: "rgba(2,170,235,0.08)",
    border: "rgba(2,170,235,0.2)",
    dot: "#02AAEB",
    text: "#1B77BE",
    label: "Medium confidence",
    hint: "3 to 6 months of data",
  },
  high: {
    bg: "rgba(22,163,74,0.08)",
    border: "rgba(22,163,74,0.2)",
    dot: "#16a34a",
    text: "#15803d",
    label: "High confidence",
    hint: "6+ months of data",
  },
} as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TreasuryForecastPage() {
  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury/forecast");
  }

  const latest = await getLatestForecast();

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
              Forecast
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "13px",
                color: "var(--color-text-tertiary)",
              }}
            >
              {latest
                ? `Last generated ${new Date(latest.generated_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "No forecast generated yet"}
            </p>
          </div>

          {/* Confidence badge */}
          {latest && (() => {
            const s = CONFIDENCE_STYLES[latest.confidence_level];
            return (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  backgroundColor: s.bg,
                  border: `1.5px solid ${s.border}`,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: s.dot,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: s.text,
                      lineHeight: 1.2,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {s.hint}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* No forecast yet — CTA */}
        {!latest && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
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
                background:
                  "linear-gradient(135deg, rgba(2,170,235,0.12), rgba(27,119,190,0.12))",
                border: "1.5px solid rgba(2,170,235,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChartLine size={36} weight="duotone" color="#1B77BE" />
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
                Generate your first forecast
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "var(--color-text-secondary)",
                  maxWidth: "380px",
                }}
              >
                Pick a period below and generate a forecast to see projected income,
                expenses, savings pacing, and rebalancing suggestions.
              </p>
            </div>
          </div>
        )}

        {/* Projection stat cards */}
        {latest && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              {
                label: "Projected Income",
                value: currency0.format(latest.projected_income),
                icon: <ArrowUp size={20} weight="duotone" color="#16a34a" />,
                accent: "rgba(22,163,74,0.07)",
                borderColor: "rgba(22,163,74,0.18)",
              },
              {
                label: "Projected Expenses",
                value: currency0.format(latest.projected_expenses),
                icon: <ArrowDown size={20} weight="duotone" color="#dc2626" />,
                accent: "rgba(220,38,38,0.06)",
                borderColor: "rgba(220,38,38,0.13)",
              },
              {
                label: "Projected Net",
                value: currency0.format(latest.projected_net),
                icon: (
                  <Equals
                    size={20}
                    weight="duotone"
                    color={latest.projected_net >= 0 ? "#16a34a" : "#dc2626"}
                  />
                ),
                accent:
                  latest.projected_net >= 0
                    ? "rgba(22,163,74,0.07)"
                    : "rgba(220,38,38,0.06)",
                borderColor:
                  latest.projected_net >= 0
                    ? "rgba(22,163,74,0.18)"
                    : "rgba(220,38,38,0.13)",
              },
              {
                label: "Data Available",
                value: `${latest.data_months} mo.`,
                icon: <Database size={20} weight="duotone" color="#1B77BE" />,
                accent: "rgba(2,170,235,0.07)",
                borderColor: "rgba(2,170,235,0.18)",
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
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {card.value}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Two-column: Savings Projections + Rebalancing */}
        {latest && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Savings goal projections */}
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
                  Savings Goal Projections
                </h2>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  Estimated date to reach each goal
                </p>
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {latest.savings_projections.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "var(--color-text-tertiary)",
                      textAlign: "center",
                      padding: "16px 0",
                    }}
                  >
                    No active savings goals
                  </p>
                ) : (
                  latest.savings_projections.map((proj) => {
                    const pct =
                      proj.target > 0
                        ? Math.min((proj.current / proj.target) * 100, 100)
                        : 0;
                    return (
                      <div
                        key={proj.goal_name}
                        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--color-text-primary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {proj.goal_name}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--color-text-tertiary)",
                                marginTop: "1px",
                              }}
                            >
                              {currency0.format(proj.current)} of{" "}
                              {currency0.format(proj.target)}
                            </div>
                          </div>

                          {/* On pace / Behind badge */}
                          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "20px",
                                backgroundColor: proj.on_pace
                                  ? "rgba(22,163,74,0.1)"
                                  : "rgba(220,38,38,0.08)",
                                color: proj.on_pace ? "#15803d" : "#b91c1c",
                                letterSpacing: "0.04em",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {proj.on_pace ? (
                                <TrendUp size={10} weight="bold" />
                              ) : (
                                <TrendDown size={10} weight="bold" />
                              )}
                              {proj.on_pace ? "On pace" : "Behind"}
                            </span>
                            {proj.projected_date && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-text-tertiary)",
                                }}
                              >
                                {new Date(proj.projected_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
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
                              width: `${Math.round(pct * 10) / 10}%`,
                              borderRadius: "99px",
                              background: proj.on_pace
                                ? "linear-gradient(90deg, #02AAEB, #1B77BE)"
                                : "#dc2626",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Rebalancing suggestions */}
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
                  Rebalancing Suggestions
                </h2>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  Moves to bring allocations back on target
                </p>
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {latest.rebalancing.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      padding: "20px 0",
                      textAlign: "center",
                    }}
                  >
                    <ArrowsLeftRight
                      size={28}
                      weight="duotone"
                      color="var(--color-warm-gray-300)"
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      Allocations are on target
                    </p>
                  </div>
                ) : (
                  latest.rebalancing.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        border: "1.5px solid rgba(2,170,235,0.15)",
                        backgroundColor: "rgba(2,170,235,0.04)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(2,170,235,0.1)",
                          border: "1px solid rgba(2,170,235,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: "1px",
                        }}
                      >
                        <ArrowsLeftRight size={15} weight="bold" color="#1B77BE" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            lineHeight: 1.4,
                          }}
                        >
                          Move {currency0.format(item.amount)}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-secondary)",
                            marginTop: "2px",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.from_account}{" "}
                          <span style={{ color: "var(--color-text-tertiary)" }}>to</span>{" "}
                          {item.to_account}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-text-tertiary)",
                            marginTop: "4px",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.reason}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Interactive shell: period selector, generate button, what-if scenarios */}
        <ForecastShell initialForecast={latest} />

      </div>
    </div>
  );
}
