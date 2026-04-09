"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowsClockwise,
  CalendarPlus,
  CaretLeft,
  CaretRight,
  Check,
} from "@phosphor-icons/react";
import { colorFor } from "./palette";

type Property = { id: string; name: string };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarToolbar({
  year,
  month,
  properties,
  hiddenProperties,
  onToggleProperty,
  onOpenSync,
  onOpenBlock,
}: {
  year: number;
  month: number;
  properties: Property[];
  hiddenProperties: Set<string>;
  onToggleProperty: (id: string) => void;
  onOpenSync: () => void;
  onOpenBlock: () => void;
}) {
  const searchParams = useSearchParams();

  const navHref = (newMonth: number, newYear: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    return `?${params.toString()}`;
  };

  const prevHref = navHref(
    month === 0 ? 11 : month - 1,
    month === 0 ? year - 1 : year,
  );
  const nextHref = navHref(
    month === 11 ? 0 : month + 1,
    month === 11 ? year + 1 : year,
  );
  const todayHref = navHref(new Date().getMonth(), new Date().getFullYear());

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: month nav */}
      <div className="flex items-center gap-2">
        <Link
          href={prevHref}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
          aria-label="Previous month"
          rel="prev"
        >
          <CaretLeft size={13} weight="bold" />
        </Link>
        <Link
          href={nextHref}
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
          aria-label="Next month"
          rel="next"
        >
          <CaretRight size={13} weight="bold" />
        </Link>
        <h2
          className="ml-1 text-lg font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {MONTH_NAMES[month]} {year}
        </h2>
        <Link
          href={todayHref}
          className="ml-2 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-secondary)",
          }}
        >
          Today
        </Link>
      </div>

      {/* Right: filter chips + actions */}
      <div className="flex flex-wrap items-center gap-2">
        {properties.length > 1
          ? properties.map((p, i) => {
              const c = colorFor(i);
              const hidden = hiddenProperties.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggleProperty(p.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: hidden
                      ? "var(--color-warm-gray-50)"
                      : "var(--color-white)",
                    borderColor: "var(--color-warm-gray-200)",
                    color: hidden
                      ? "var(--color-text-tertiary)"
                      : "var(--color-text-primary)",
                    opacity: hidden ? 0.55 : 1,
                  }}
                  aria-pressed={!hidden}
                >
                  {!hidden ? (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.solid }}
                      aria-hidden
                    />
                  ) : (
                    <Check size={10} weight="bold" aria-hidden />
                  )}
                  <span className="max-w-[120px] truncate">{p.name}</span>
                </button>
              );
            })
          : null}

        <div className="ml-1 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSync}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Sync to your calendar"
            title="Sync to your calendar"
          >
            <ArrowsClockwise size={14} weight="bold" />
          </button>
          <button
            type="button"
            onClick={onOpenBlock}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Request a date block"
            title="Request a date block"
          >
            <CalendarPlus size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
