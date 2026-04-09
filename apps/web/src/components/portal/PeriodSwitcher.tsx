import Link from "next/link";
import { PERIOD_LABELS, type PeriodKey } from "@/lib/periods";

const KEYS: PeriodKey[] = ["month", "last", "90d", "ytd"];

export function PeriodSwitcher({
  active,
  basePath = "/portal/dashboard",
}: {
  active: PeriodKey;
  basePath?: string;
}) {
  return (
    <nav aria-label="Time period" className="flex flex-wrap gap-1.5">
      {KEYS.map((key) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={key === "month" ? basePath : `${basePath}?period=${key}`}
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors duration-200"
            style={{
              backgroundColor: isActive
                ? "var(--color-brand)"
                : "var(--color-warm-gray-100)",
              color: isActive ? "#ffffff" : "var(--color-text-secondary)",
            }}
            aria-current={isActive ? "true" : undefined}
          >
            {PERIOD_LABELS[key]}
          </Link>
        );
      })}
    </nav>
  );
}
