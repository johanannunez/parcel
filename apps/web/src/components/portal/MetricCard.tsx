import type { ReactNode } from "react";

type Tone = "brand" | "success" | "amber" | "neutral";

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: "rgba(2, 170, 235, 0.10)", fg: "#0c6fae" },
  success: { bg: "rgba(22, 163, 74, 0.10)", fg: "#15803d" },
  amber: { bg: "rgba(245, 158, 11, 0.12)", fg: "#b45309" },
  neutral: { bg: "rgba(118, 113, 112, 0.10)", fg: "#4b4948" },
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: Tone;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className="group relative flex flex-col gap-5 rounded-2xl border p-6 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.18)]"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div className="flex items-start justify-between">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: t.bg, color: t.fg }}
        >
          {icon}
        </span>
        <span
          className="text-[11px] font-medium uppercase tracking-[0.14em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {label}
        </span>
      </div>
      <div>
        <div
          className="text-[34px] font-semibold leading-none tracking-tight tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </div>
        {hint ? (
          <div
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}
