"use client";

import { useState, useMemo } from "react";
import {
  CaretDown,
  CaretUp,
  CheckSquare,
  Square,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { amenityCategories, type AmenityCategory } from "@/lib/wizard/amenities";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

export function AmenitiesForm() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["essentials"]));
  const [search, setSearch] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(cat: AmenityCategory) {
    const allIds = cat.items.map((i) => i.id);
    const allSelected = allIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleExpanded(catId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return amenityCategories;
    const q = search.toLowerCase();
    return amenityCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search]);

  return (
    <form
      action="/portal/setup"
      method="get"
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="just" value="amenities" />

      {/* Search */}
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
        }}
      >
        <MagnifyingGlass
          size={18}
          weight="bold"
          style={{ color: "var(--color-text-tertiary)" }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search amenities..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)]"
          style={{ color: "var(--color-text-primary)" }}
        />
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {selected.size} selected
        </span>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-3">
        {filteredCategories.map((cat) => {
          const isExpanded = expanded.has(cat.id) || search.trim().length > 0;
          const catCount = cat.items.filter((i) => selected.has(i.id)).length;

          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                backgroundColor: "var(--color-white)",
              }}
            >
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleExpanded(cat.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--color-warm-gray-50)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-base font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {cat.label}
                  </span>
                  {catCount > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                      style={{
                        backgroundColor: "rgba(2, 170, 235, 0.08)",
                        color: "var(--color-brand)",
                      }}
                    >
                      {catCount} of {cat.items.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(cat);
                    }}
                    className="text-xs font-medium transition-colors"
                    style={{ color: "var(--color-brand)" }}
                  >
                    {cat.items.every((i) => selected.has(i.id))
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                  {isExpanded ? (
                    <CaretUp size={16} style={{ color: "var(--color-text-tertiary)" }} />
                  ) : (
                    <CaretDown size={16} style={{ color: "var(--color-text-tertiary)" }} />
                  )}
                </div>
              </button>

              {/* Items */}
              {isExpanded && (
                <div
                  className="grid grid-cols-1 gap-0 border-t px-2 py-2 sm:grid-cols-2 lg:grid-cols-3"
                  style={{ borderColor: "var(--color-warm-gray-100)" }}
                >
                  {cat.items.map((item) => {
                    const isSelected = selected.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-warm-gray-50)]"
                        style={{
                          color: isSelected
                            ? "var(--color-text-primary)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare
                            size={18}
                            weight="fill"
                            style={{ color: "var(--color-brand)" }}
                          />
                        ) : (
                          <Square
                            size={18}
                            weight="regular"
                            style={{ color: "var(--color-warm-gray-400)" }}
                          />
                        )}
                        <span className={isSelected ? "font-medium" : ""}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <StepSaveBar pending={false} />
    </form>
  );
}
