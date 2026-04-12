"use client";

import { useState, useMemo, useCallback } from "react";

type Props = {
  data: { date: string; count: number }[];
};

// ---------------------------------------------------------------------------
// Color intensity based on count
// ---------------------------------------------------------------------------

function cellColor(count: number): string {
  if (count === 0) return "var(--color-warm-gray-100)";
  if (count === 1) return "rgba(27, 119, 190, 0.15)";
  if (count <= 3) return "rgba(27, 119, 190, 0.35)";
  return "rgba(27, 119, 190, 0.65)";
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function toDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Build the grid data: 7 rows x ~13 columns (90 days)
// ---------------------------------------------------------------------------

type CellData = {
  date: string;
  count: number;
  col: number;
  row: number;
};

function buildGrid(data: { date: string; count: number }[]): {
  cells: CellData[];
  totalCols: number;
  monthLabels: { label: string; col: number }[];
} {
  const countMap = new Map<string, number>();
  for (const d of data) {
    countMap.set(d.date, d.count);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Go back 90 days
  const start = new Date(today);
  start.setDate(start.getDate() - 89);

  // Align to the previous Sunday so the grid starts on a clean week boundary
  const startDow = start.getDay(); // 0 = Sunday
  const alignedStart = new Date(start);
  alignedStart.setDate(alignedStart.getDate() - startDow);

  const cells: CellData[] = [];
  const monthLabels: { label: string; col: number }[] = [];
  const seenMonths = new Set<string>();

  const cursor = new Date(alignedStart);
  let col = 0;

  while (cursor <= today) {
    for (let row = 0; row < 7; row++) {
      const current = new Date(alignedStart);
      current.setDate(current.getDate() + col * 7 + row);

      if (current > today) break;

      const key = toDateKey(current);
      const count = countMap.get(key) ?? 0;

      cells.push({ date: key, count, col, row });

      // Track month label positions (first occurrence of each month)
      const monthKey = `${current.getFullYear()}-${current.getMonth()}`;
      if (!seenMonths.has(monthKey) && current.getDate() <= 7) {
        seenMonths.add(monthKey);
        monthLabels.push({
          label: MONTH_NAMES[current.getMonth()],
          col,
        });
      }
    }

    col++;
    const nextWeek = new Date(alignedStart);
    nextWeek.setDate(nextWeek.getDate() + col * 7);
    if (nextWeek > today) break;
  }

  return { cells, totalCols: col, monthLabels };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CELL_SIZE = 12;
const CELL_GAP = 1;
const LABEL_WIDTH = 28;
const HEADER_HEIGHT = 16;

export function ActivityHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  const { cells, totalCols, monthLabels } = useMemo(() => buildGrid(data), [data]);

  const gridWidth = totalCols * (CELL_SIZE + CELL_GAP);
  const gridHeight = 7 * (CELL_SIZE + CELL_GAP);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, cell: CellData) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const parentRect = e.currentTarget.closest("[data-heatmap-root]")?.getBoundingClientRect();
      if (!parentRect) return;
      setTooltip({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top - 4,
        date: cell.date,
        count: cell.count,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div
      data-heatmap-root
      className="relative inline-block"
      style={{ userSelect: "none" }}
    >
      {/* Month labels */}
      <div
        className="flex"
        style={{
          paddingLeft: LABEL_WIDTH,
          height: HEADER_HEIGHT,
          marginBottom: 2,
        }}
      >
        {monthLabels.map((m) => (
          <span
            key={`${m.label}-${m.col}`}
            className="absolute text-[10px] font-medium"
            style={{
              left: LABEL_WIDTH + m.col * (CELL_SIZE + CELL_GAP),
              top: 0,
              color: "var(--color-text-tertiary)",
            }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div
          className="flex shrink-0 flex-col"
          style={{
            width: LABEL_WIDTH,
            height: gridHeight,
            justifyContent: "space-between",
          }}
        >
          {DAY_LABELS.map((label, i) => (
            <span
              key={i}
              className="text-[10px] font-medium leading-none"
              style={{
                height: CELL_SIZE,
                display: "flex",
                alignItems: "center",
                color: "var(--color-text-tertiary)",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div
          className="relative"
          style={{
            display: "grid",
            gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
            gridAutoFlow: "column",
            gridAutoColumns: `${CELL_SIZE}px`,
            gap: `${CELL_GAP}px`,
            width: gridWidth,
            height: gridHeight,
          }}
        >
          {cells.map((cell) => (
            <div
              key={cell.date}
              className="rounded-[2px]"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: cellColor(cell.count),
                gridRow: cell.row + 1,
                gridColumn: cell.col + 1,
                cursor: "default",
              }}
              onMouseEnter={(e) => handleMouseEnter(e, cell)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            backgroundColor: "var(--color-text-primary)",
            color: "var(--color-white)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          <span style={{ fontWeight: 600 }}>{tooltip.count}</span>
          {" "}
          {tooltip.count === 1 ? "event" : "events"} on{" "}
          {formatTooltipDate(tooltip.date)}
        </div>
      )}
    </div>
  );
}
