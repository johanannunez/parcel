"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDots,
  CalendarPlus,
  CaretLeft,
  CaretRight,
  Check,
  Link as LinkIcon,
  Rows,
} from "@phosphor-icons/react";
import { colorFor } from "./palette";

export type CalendarView = "timeline" | "month";

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
  view,
  onChangeView,
  activePropertyId,
  onChangeActiveProperty,
}: {
  year: number;
  month: number;
  properties: Property[];
  hiddenProperties: Set<string>;
  onToggleProperty: (id: string) => void;
  onOpenSync: () => void;
  onOpenBlock: () => void;
  view: CalendarView;
  onChangeView: (v: CalendarView) => void;
  activePropertyId: string | null;
  onChangeActiveProperty: (id: string) => void;
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
        {properties.length > 1 && view === "timeline"
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

        {properties.length > 1 && view === "month"
          ? properties.map((p, i) => {
              const c = colorFor(i);
              const isActive =
                activePropertyId === p.id ||
                (!activePropertyId && i === 0);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChangeActiveProperty(p.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-white)"
                      : "var(--color-warm-gray-50)",
                    borderColor: isActive
                      ? c.solid
                      : "var(--color-warm-gray-200)",
                    color: isActive
                      ? "var(--color-text-primary)"
                      : "var(--color-text-tertiary)",
                    opacity: isActive ? 1 : 0.65,
                  }}
                  aria-pressed={isActive}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.solid }}
                    aria-hidden
                  />
                  <span className="max-w-[120px] truncate">{p.name}</span>
                </button>
              );
            })
          : null}

        {/* View toggle */}
        <div
          className="flex items-center gap-0.5 rounded-lg border p-0.5"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-warm-gray-50)",
          }}
        >
          {([
            { key: "timeline" as const, icon: <Rows size={14} weight="bold" />, label: "Timeline" },
            { key: "month" as const, icon: <CalendarDots size={14} weight="bold" />, label: "Month" },
          ]).map((v) => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => onChangeView(v.key)}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150"
                style={{
                  backgroundColor: active ? "var(--color-white)" : "transparent",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
                aria-label={v.label}
                title={v.label}
              >
                {v.icon}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="ml-1 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSync}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
          >
            <LinkIcon size={13} weight="bold" />
            Subscribe
          </button>
          <button
            type="button"
            onClick={onOpenBlock}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
          >
            <CalendarPlus size={13} weight="duotone" />
            Block dates
          </button>
        </div>
      </div>
    </div>
  );
}
