"use client";

import { useState, useTransition } from "react";
import {
  ChartLine,
  Buildings,
  ArrowsClockwise,
  Lightning,
  TrendDown,
  Sliders,
} from "@phosphor-icons/react";
import { generateForecastAction } from "./actions";
import type { ForecastResult } from "@/lib/treasury/forecast";

// ---------------------------------------------------------------------------
// Currency helper (client-side, no import from lib)
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Period = 30 | 60 | 90;

type Props = {
  initialForecast: ForecastResult | null;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForecastShell({ initialForecast }: Props) {
  const [period, setPeriod] = useState<Period>(
    (initialForecast?.period_days as Period | undefined) ?? 30,
  );
  const [forecast, setForecast] = useState<ForecastResult | null>(initialForecast);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // What-if state
  const [extraProperties, setExtraProperties] = useState(0);
  const [dropPct, setDropPct] = useState(0);
  const [allocationEdits, setAllocationEdits] = useState<Record<string, number>>({});

  const ALLOCATION_DEFAULTS: Record<string, number> = {
    owners_comp: 50,
    tax: 16,
    emergency: 15,
    opex: 10,
    profit: 5,
    generosity: 4,
  };

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateForecastAction(period);
      if (result.ok) {
        setForecast(result.data);
      } else {
        setError(result.error);
      }
    });
  }

  // What-if math — all client-side
  const baseIncome = forecast?.projected_income ?? 0;
  const baseExpenses = forecast?.projected_expenses ?? 0;

  // Each extra property estimated at same income/property ratio
  const perPropertyIncome =
    extraProperties > 0 && baseIncome > 0 ? baseIncome * (extraProperties * 0.15) : 0;

  const stressedIncome = baseIncome * (1 - dropPct / 100);
  const whatIfIncome = (stressedIncome + perPropertyIncome);
  const whatIfNet = whatIfIncome - baseExpenses;

  const allocationTotal = Object.values({
    ...ALLOCATION_DEFAULTS,
    ...allocationEdits,
  }).reduce((s, v) => s + v, 0);

  const allocationValid = Math.abs(allocationTotal - 100) < 0.1;

  const tabs: { label: string; value: Period }[] = [
    { label: "30 days", value: 30 },
    { label: "60 days", value: 60 },
    { label: "90 days", value: 90 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* Period selector + Generate button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Period tabs */}
        <div
          style={{
            display: "inline-flex",
            borderRadius: "10px",
            border: "1.5px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-warm-gray-50, #fafaf9)",
            overflow: "hidden",
          }}
        >
          {tabs.map((tab) => {
            const active = tab.value === period;
            return (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  backgroundColor: active
                    ? "#1B77BE"
                    : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  letterSpacing: "-0.01em",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isPending}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: isPending
              ? "rgba(2,170,235,0.4)"
              : "linear-gradient(135deg, #02AAEB, #1B77BE)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            boxShadow: isPending ? "none" : "0 4px 12px rgba(2,170,235,0.3)",
            transition: "opacity 0.15s ease",
          }}
        >
          {isPending ? (
            <>
              <ArrowsClockwise
                size={16}
                weight="bold"
                style={{
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Generating...
            </>
          ) : (
            <>
              <ChartLine size={16} weight="bold" />
              Generate Forecast
            </>
          )}
        </button>

        {/* Keyframe for spinner */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1.5px solid rgba(220,38,38,0.2)",
            backgroundColor: "rgba(220,38,38,0.05)",
            fontSize: "13px",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {/* What-if scenarios */}
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
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Sliders size={18} weight="duotone" color="#1B77BE" />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--color-text-primary)",
              }}
            >
              What-if Scenarios
            </h2>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "var(--color-text-tertiary)",
              }}
            >
              Explore how changes would affect your projected numbers
            </p>
          </div>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* Scenario 1: Extra properties */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Buildings size={16} weight="duotone" color="#1B77BE" />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                What if I add more properties?
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={extraProperties}
                onChange={(e) => setExtraProperties(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#1B77BE" }}
              />
              <div
                style={{
                  minWidth: "28px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  textAlign: "right",
                }}
              >
                +{extraProperties}
              </div>
            </div>

            {extraProperties > 0 && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(2,170,235,0.05)",
                  border: "1.5px solid rgba(2,170,235,0.15)",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Estimated income increase:{" "}
                <span
                  style={{ fontWeight: 700, color: "#16a34a" }}
                >
                  +{fmt(perPropertyIncome)}
                </span>{" "}
                over {period} days
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "var(--color-warm-gray-100)" }} />

          {/* Scenario 2: Income drop stress test */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <TrendDown size={16} weight="duotone" color="#d97706" />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                What if income drops?
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={dropPct}
                onChange={(e) => setDropPct(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#d97706" }}
              />
              <div
                style={{
                  minWidth: "40px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: dropPct > 0 ? "#b45309" : "var(--color-text-primary)",
                  textAlign: "right",
                }}
              >
                -{dropPct}%
              </div>
            </div>

            {dropPct > 0 && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: dropPct >= 30 ? "rgba(220,38,38,0.05)" : "rgba(217,119,6,0.05)",
                  border: `1.5px solid ${dropPct >= 30 ? "rgba(220,38,38,0.15)" : "rgba(217,119,6,0.15)"}`,
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div>
                  Stressed income:{" "}
                  <span style={{ fontWeight: 700, color: "#b45309" }}>
                    {fmt(stressedIncome)}
                  </span>
                </div>
                <div>
                  Projected net:{" "}
                  <span
                    style={{
                      fontWeight: 700,
                      color: whatIfNet >= 0 ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {fmt(whatIfNet)}
                  </span>
                  {whatIfNet < 0 && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: "20px",
                        backgroundColor: "rgba(220,38,38,0.1)",
                        color: "#b91c1c",
                      }}
                    >
                      Cash deficit
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "var(--color-warm-gray-100)" }} />

          {/* Scenario 3: Allocation percentage adjustments */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Lightning size={16} weight="duotone" color="#8b5cf6" />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                What if allocation percentages change?
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {Object.entries(ALLOCATION_DEFAULTS).map(([key, defaultVal]) => {
                const current = allocationEdits[key] ?? defaultVal;
                const label = key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-text-tertiary)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={current}
                        onChange={(e) =>
                          setAllocationEdits((prev) => ({
                            ...prev,
                            [key]: Math.max(0, Math.min(100, Number(e.target.value))),
                          }))
                        }
                        style={{
                          width: "64px",
                          padding: "6px 8px",
                          borderRadius: "7px",
                          border: "1.5px solid var(--color-warm-gray-200)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          textAlign: "right",
                          outline: "none",
                        }}
                      />
                      <span
                        style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}
                      >
                        %
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Allocation total indicator */}
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "9px",
                backgroundColor: allocationValid
                  ? "rgba(22,163,74,0.06)"
                  : "rgba(220,38,38,0.05)",
                border: `1.5px solid ${allocationValid ? "rgba(22,163,74,0.18)" : "rgba(220,38,38,0.18)"}`,
                fontSize: "12px",
                fontWeight: 600,
                color: allocationValid ? "#15803d" : "#b91c1c",
              }}
            >
              Total allocation: {allocationTotal.toFixed(1)}%
              {allocationValid ? " — balanced" : " — must equal 100%"}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
