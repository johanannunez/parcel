"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

type DatePickerInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

function toInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseValue(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDisplay(value: string, placeholder: string): string {
  const date = parseValue(value);
  if (!date) return placeholder;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function calendarDays(viewDate: Date): Date[] {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Select date",
  className,
  id,
  disabled,
  "aria-label": ariaLabel,
}: DatePickerInputProps) {
  const selected = parseValue(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());
  const ref = useRef<HTMLDivElement>(null);
  const days = useMemo(() => calendarDays(viewDate), [viewDate]);
  const today = new Date();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function shiftMonth(offset: number) {
    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarBlank size={13} weight="duotone" className="shrink-0" />
          <span className="truncate">{formatDisplay(value, placeholder)}</span>
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 z-50 mt-1.5 w-[288px] rounded-xl border p-3 shadow-lg"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            boxShadow:
              "0 16px 38px rgba(23, 32, 42, 0.13), 0 4px 12px rgba(23, 32, 42, 0.08)",
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-secondary)",
              }}
            >
              <CaretLeft size={13} weight="bold" />
            </button>
            <div
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {monthLabel(viewDate)}
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-secondary)",
              }}
            >
              <CaretRight size={13} weight="bold" />
            </button>
          </div>

          <div
            className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const selectedDay = selected ? sameDay(day, selected) : false;
              const isToday = sameDay(day, today);
              const inMonth = day.getMonth() === viewDate.getMonth();
              return (
                <button
                  key={toInputValue(day)}
                  type="button"
                  onClick={() => {
                    onChange(toInputValue(day));
                    setOpen(false);
                  }}
                  className="flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: selectedDay
                      ? "var(--color-brand)"
                      : isToday
                        ? "rgba(2, 170, 235, 0.08)"
                        : "transparent",
                    color: selectedDay
                      ? "#ffffff"
                      : inMonth
                        ? "var(--color-text-primary)"
                        : "var(--color-text-tertiary)",
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
