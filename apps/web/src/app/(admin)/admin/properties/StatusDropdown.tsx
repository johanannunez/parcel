"use client";

import { useState, useRef, useEffect } from "react";
import { updateChecklistStatus } from "./actions";
import { STATUS_CONFIG, type ChecklistStatus } from "@/lib/checklist";

const statuses: ChecklistStatus[] = ["not_started", "in_progress", "pending_owner", "stuck", "completed"];

export function StatusDropdown({
  itemId,
  currentStatus,
}: {
  itemId: string;
  currentStatus: ChecklistStatus;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSelect(newStatus: ChecklistStatus) {
    if (newStatus === status) {
      setOpen(false);
      return;
    }
    setStatus(newStatus);
    setOpen(false);
    setSaving(true);
    const result = await updateChecklistStatus(itemId, newStatus);
    setSaving(false);
    if (!result.ok) {
      setStatus(status); // revert on failure
    }
  }

  const cfg = STATUS_CONFIG[status];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={saving}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 10px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: cfg.bg,
          color: cfg.color,
          fontSize: "11px",
          fontWeight: 600,
          cursor: saving ? "wait" : "pointer",
          opacity: saving ? 0.7 : 1,
          letterSpacing: "0.01em",
          lineHeight: "20px",
          whiteSpace: "nowrap",
          transition: "opacity 0.15s ease",
        }}
      >
        {cfg.label}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ opacity: 0.7 }}>
          <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 50,
            minWidth: "140px",
            borderRadius: "8px",
            border: "1px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {statuses.map((s) => {
            const c = STATUS_CONFIG[s];
            const isSelected = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSelect(s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: isSelected ? "var(--color-warm-gray-100)" : "transparent",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    backgroundColor: c.bg,
                    flexShrink: 0,
                  }}
                />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
