"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDots,
  CalendarPlus,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  House,
  Link as LinkIcon,
  Rows,
} from "@phosphor-icons/react";

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

  const allVisible = hiddenProperties.size === 0;
  const visibleCount = properties.length - hiddenProperties.size;

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

      {/* Right: property dropdown + view toggle + actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Property filter dropdown */}
        {properties.length > 1 && (
          <PropertyDropdown
            properties={properties}
            hiddenProperties={hiddenProperties}
            onToggleProperty={onToggleProperty}
            allVisible={allVisible}
            visibleCount={visibleCount}
            view={view}
            activePropertyId={activePropertyId}
            onChangeActiveProperty={onChangeActiveProperty}
          />
        )}

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

// ---------------------------------------------------------------------------
// Property dropdown (replaces individual property pills)
// ---------------------------------------------------------------------------

function PropertyDropdown({
  properties,
  hiddenProperties,
  onToggleProperty,
  allVisible,
  visibleCount,
  view,
  activePropertyId,
  onChangeActiveProperty,
}: {
  properties: { id: string; name: string }[];
  hiddenProperties: Set<string>;
  onToggleProperty: (id: string) => void;
  allVisible: boolean;
  visibleCount: number;
  view: CalendarView;
  activePropertyId: string | null;
  onChangeActiveProperty: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const label =
    view === "month"
      ? properties.find((p) => p.id === (activePropertyId ?? properties[0]?.id))?.name ?? "All Homes"
      : allVisible
        ? "All Homes"
        : visibleCount === 1
          ? properties.find((p) => !hiddenProperties.has(p.id))?.name ?? "1 Home"
          : `${visibleCount} Homes`;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          color: "var(--color-text-primary)",
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <House size={14} weight="duotone" />
        {label}
        <CaretDown
          size={12}
          weight="bold"
          style={{
            color: "var(--color-text-tertiary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {open && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-xl border shadow-lg"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <div className="max-h-72 overflow-y-auto py-1.5">
              {view === "timeline" ? (
                <>
                  {/* Show All option */}
                  <button
                    type="button"
                    onClick={() => {
                      // Toggle all visible
                      if (allVisible) return;
                      for (const p of properties) {
                        if (hiddenProperties.has(p.id)) {
                          onToggleProperty(p.id);
                        }
                      }
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-[12px] font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
                    style={{
                      color: allVisible
                        ? "var(--color-brand)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded border"
                      style={{
                        backgroundColor: allVisible
                          ? "var(--color-brand)"
                          : "transparent",
                        borderColor: allVisible
                          ? "var(--color-brand)"
                          : "var(--color-warm-gray-200)",
                      }}
                    >
                      {allVisible && (
                        <Check size={10} weight="bold" color="var(--color-white)" />
                      )}
                    </span>
                    All Homes
                  </button>

                  <div
                    className="mx-3 my-1 border-t"
                    style={{ borderColor: "var(--color-warm-gray-100)" }}
                  />

                  {properties.map((p) => {
                    const visible = !hiddenProperties.has(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onToggleProperty(p.id)}
                        className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-[12px] transition-colors hover:bg-[var(--color-warm-gray-50)]"
                        style={{
                          color: visible
                            ? "var(--color-text-primary)"
                            : "var(--color-text-tertiary)",
                        }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded border"
                          style={{
                            backgroundColor: visible
                              ? "var(--color-brand)"
                              : "transparent",
                            borderColor: visible
                              ? "var(--color-brand)"
                              : "var(--color-warm-gray-200)",
                          }}
                        >
                          {visible && (
                            <Check size={10} weight="bold" color="var(--color-white)" />
                          )}
                        </span>
                        <span className="truncate font-medium">{p.name}</span>
                      </button>
                    );
                  })}
                </>
              ) : (
                /* Month view: single-select (radio-like) */
                properties.map((p) => {
                  const isActive =
                    activePropertyId === p.id ||
                    (!activePropertyId && p.id === properties[0]?.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onChangeActiveProperty(p.id);
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-[12px] transition-colors hover:bg-[var(--color-warm-gray-50)]"
                      style={{
                        color: isActive
                          ? "var(--color-brand)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full border"
                        style={{
                          backgroundColor: isActive
                            ? "var(--color-brand)"
                            : "transparent",
                          borderColor: isActive
                            ? "var(--color-brand)"
                            : "var(--color-warm-gray-200)",
                        }}
                      >
                        {isActive && (
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: "var(--color-white)" }}
                          />
                        )}
                      </span>
                      <span className="truncate font-medium">{p.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
