"use client";

export type BlockRequest = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "declined";
  note: string | null;
  created_at: string;
  check_in_time: string | null;
  check_out_time: string | null;
  reason: string | null;
  is_owner_staying: boolean;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  adults: number;
  children: number;
  pets: number;
  needs_lock_code: boolean;
  requested_lock_code: string | null;
  wants_cleaning: boolean;
  cleaning_fee: number | null;
  damage_acknowledged: boolean;
};

const HATCHING = `repeating-linear-gradient(
  135deg,
  transparent,
  transparent 3px,
  rgba(0, 0, 0, 0.07) 3px,
  rgba(0, 0, 0, 0.07) 4px
)`;

const HATCHING_AMBER = `repeating-linear-gradient(
  135deg,
  transparent,
  transparent 3px,
  rgba(180, 83, 9, 0.1) 3px,
  rgba(180, 83, 9, 0.1) 4px
)`;

export function BlockBar({
  block,
  startDay,
  endDay,
  daysInMonth,
  colWidth,
  rowHeight,
  onClick,
}: {
  block: BlockRequest;
  startDay: number;
  endDay: number;
  daysInMonth: number;
  colWidth: number;
  rowHeight: number;
  onClick?: () => void;
}) {
  const clampedStart = Math.max(0, startDay);
  const clampedEnd = Math.min(daysInMonth, endDay);
  if (clampedStart >= clampedEnd) return null;

  const span = clampedEnd - clampedStart;
  const left = clampedStart * colWidth + 1;
  const width = span * colWidth - 2;
  const inset = 4;
  const barHeight = rowHeight - inset * 2;

  const isApproved = block.status === "approved";
  const showLabel = span >= 2 && width > 46;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${isApproved ? "Blocked" : "Pending block"}: ${block.start_date} to ${block.end_date}${block.note ? ` (${block.note})` : ""}`}
      className="absolute flex items-center truncate text-left transition-opacity hover:opacity-80"
      style={{
        left,
        width,
        top: inset,
        height: barHeight,
        backgroundImage: isApproved ? HATCHING : HATCHING_AMBER,
        backgroundColor: isApproved
          ? "rgba(107, 114, 128, 0.08)"
          : "rgba(245, 158, 11, 0.08)",
        border: `1px dashed ${isApproved ? "var(--color-warm-gray-200)" : "rgba(245, 158, 11, 0.45)"}`,
        borderRadius: 5,
        paddingLeft: showLabel ? 6 : 0,
        fontSize: 9,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: isApproved
          ? "var(--color-text-tertiary)"
          : "#b45309",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {showLabel ? (isApproved ? "Blocked" : "Pending") : null}
    </button>
  );
}
