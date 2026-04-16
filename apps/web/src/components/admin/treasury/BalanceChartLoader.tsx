"use client";

import { useEffect, useState } from "react";
import BalanceChart from "./BalanceChart";

type DataPoint = {
  date: string;
  balance: number;
};

export default function BalanceChartLoader({ currentBalance }: { currentBalance: number }) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/treasury/balance-history");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (!cancelled) {
          let points: DataPoint[] = json.data ?? [];

          // Always include today's current balance as the latest point
          const today = new Date().toISOString().split("T")[0];
          const hasToday = points.some((p: DataPoint) => p.date === today);
          if (!hasToday) {
            points = [...points, { date: today, balance: currentBalance }];
          } else {
            // Update today's point with fresh balance
            points = points.map((p: DataPoint) =>
              p.date === today ? { ...p, balance: currentBalance } : p,
            );
          }

          setData(points);
        }
      } catch {
        // If table doesn't exist yet, just show current balance
        if (!cancelled) {
          const today = new Date().toISOString().split("T")[0];
          setData([{ date: today, balance: currentBalance }]);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [currentBalance]);

  if (!loaded) {
    return (
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1.5px solid var(--color-warm-gray-200)",
          borderRadius: "16px",
          padding: "24px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>Loading chart...</span>
      </div>
    );
  }

  return <BalanceChart data={data} />;
}
