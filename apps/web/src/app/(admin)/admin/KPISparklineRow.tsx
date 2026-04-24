'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import type { TrendPoint } from '@/lib/admin/dashboard-v2';
import styles from './KPISparklineRow.module.css';

type SparkCard = {
  label: string;
  value: string;
  subValue?: string;
  trend: TrendPoint[];
  color: string;
  gradientId: string;
};

function trendPct(points: TrendPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  if (first === 0) return null;
  return Math.round(((last - first) / first) * 100);
}

function formatPct(pct: number | null): string {
  if (pct === null) return '';
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function SparkCard({ label, value, subValue, trend, color, gradientId }: SparkCard) {
  const pct = trendPct(trend);
  const isUp = pct !== null && pct >= 0;
  const chartData = trend.length > 0 ? trend : [{ date: '', value: 0 }, { date: '', value: 0 }];

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardLabel}>{label}</span>
        {pct !== null && (
          <span className={`${styles.trendBadge} ${isUp ? styles.trendUp : styles.trendDown}`}>
            {isUp ? '↑' : '↓'} {formatPct(pct)}
          </span>
        )}
      </div>
      <div className={styles.cardValue}>{value}</div>
      {subValue && <div className={styles.cardSub}>{subValue}</div>}
      <div className={styles.sparkWrap}>
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ display: 'none' }}
              cursor={false}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type Props = {
  pipelineMrr: number;
  pipelineTrend: TrendPoint[];
  activeOwners: number;
  ownerTrend: TrendPoint[];
  revenueCollected: number;
  revenueTrend: TrendPoint[];
};

function formatMrr(cents: number): string {
  const dollars = cents;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars}`;
}

function formatRevenue(dollars: number): string {
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars}`;
}

export function KPISparklineRow({
  pipelineMrr,
  pipelineTrend,
  activeOwners,
  ownerTrend,
  revenueCollected,
  revenueTrend,
}: Props) {
  return (
    <div className={styles.row}>
      <SparkCard
        label="Pipeline MRR"
        value={formatMrr(pipelineMrr)}
        subValue="monthly recurring"
        trend={pipelineTrend}
        color="#f5a623"
        gradientId="spark-pipeline"
      />
      <SparkCard
        label="Active Owners"
        value={String(activeOwners)}
        subValue="managed properties"
        trend={ownerTrend}
        color="#3b82f6"
        gradientId="spark-owners"
      />
      <SparkCard
        label="Revenue Collected"
        value={revenueCollected > 0 ? formatRevenue(revenueCollected) : '--'}
        subValue="last 6 months"
        trend={revenueTrend}
        color="#22c55e"
        gradientId="spark-revenue"
      />
    </div>
  );
}
