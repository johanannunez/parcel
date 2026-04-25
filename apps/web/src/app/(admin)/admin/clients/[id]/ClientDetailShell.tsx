"use client";

import { useState, Suspense, useTransition, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CopySimple,
  Warning,
  Clock,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  startOfMonth,
  getDaysInMonth,
  getDay,
  addMonths,
  subMonths,
  format as formatDate,
} from "date-fns";
import type { ClientDetail } from "@/lib/admin/client-detail";
import type { NextMeeting } from "@/lib/admin/client-meetings";
import type { AdminProfile } from "./client-actions";
import { updateClientFields } from "./client-actions";
import { StagePopover } from "./StagePopover";
import { ClientDetailSidebar } from "./ClientDetailSidebar";
import { ClientNameContext } from "./ClientNameContext";
import styles from "./ClientDetailShell.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey =
  | "overview"
  | "properties"
  | "tasks"
  | "meetings"
  | "intelligence"
  | "messaging"
  | "documents"
  | "billing"
  | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview",     label: "Overview"      },
  { key: "properties",   label: "Properties"    },
  { key: "tasks",        label: "Tasks"         },
  { key: "meetings",     label: "Meetings"      },
  { key: "intelligence", label: "Intelligence"  },
  { key: "messaging",    label: "Communication" },
  { key: "documents",    label: "Documents"     },
  { key: "billing",      label: "Billing"       },
  { key: "settings",     label: "Settings"      },
];

const TAB_KEYS = TABS.map((t) => t.key) as readonly string[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeDays(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// "Mon, Apr 23 · 3:14 PM"
function formatDateTimeWithDay(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const dayStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dayStr} · ${timeStr}`;
}

// "Mon, Apr 28" — for follow-up (date only, no time stored)
function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// "Mon, May 5 · 2:00 PM" for next meeting sub-line
function formatMeetingDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.ceil((d.getTime() - Date.now()) / 86400_000);
  const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const rel = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return `${dateStr} · ${timeStr} · ${rel}`;
}

function formatPhone(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  const n = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  if (n.length === 10) return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  return raw;
}

function formatRevenue(cents: number | null): string {
  if (cents === null || cents === 0) return "$0";
  const k = cents / 100;
  if (k >= 1000) return `$${(k / 1000).toFixed(1)}k`;
  return `$${k.toFixed(0)}`;
}

function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

function daysOverdue(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
}


// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* silent */ }
  };
  return (
    <button
      type="button"
      className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`}
      onClick={handleCopy}
      aria-label={`Copy ${value}`}
      title={copied ? "Copied!" : "Copy"}
    >
      <CopySimple size={12} weight="bold" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Relationship strip cell
// ---------------------------------------------------------------------------

type CellVariant = "neutral" | "blue" | "red" | "green" | "amber";

function StripCell({
  variant,
  icon,
  label,
  value,
  sub,
  actions,
  cornerAction,
  wide,
}: {
  variant: CellVariant;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  cornerAction?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`${styles.stripCell} ${styles[`stripCell_${variant}`]} ${wide ? styles.stripCellWide : ""}`}>
      <div className={styles.stripCellHead}>
        <span className={`${styles.stripCellIconBadge} ${styles[`stripCellIconBadge_${variant}` as keyof typeof styles]}`}>
          <span className={styles[`stripCellIconColor_${variant}` as keyof typeof styles]}>
            {icon}
          </span>
        </span>
        <span className={styles.stripCellLabel}>{label}</span>
        {cornerAction && <span className={styles.stripCellCornerAction}>{cornerAction}</span>}
      </div>
      <span className={`${styles.stripCellValue} ${variant === "red" ? styles.stripCellValueRed : variant === "green" ? styles.stripCellValueGreen : ""}`}>
        {value}
      </span>
      {sub && <span className={styles.stripCellSub}>{sub}</span>}
      {actions && <div className={styles.stripCellActions}>{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom date-picker popover (portal-based to escape overflow:hidden)
// ---------------------------------------------------------------------------

const QUICK_PICKS = [
  { label: "Today",    days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "+1 week",  days: 7 },
  { label: "+2 weeks", days: 14 },
];

function DatePickerPopover({
  anchorRef,
  value,
  onSelect,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  value: string | null;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initDate = value ? new Date(value.slice(0, 10) + "T00:00:00") : today;
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(initDate));

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const selectedDateStr = value ? value.slice(0, 10) : null;

  const quickPick = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    onSelect(d.toISOString());
  };

  const daysInMonth = getDaysInMonth(viewMonth);
  const firstDow = getDay(viewMonth);
  const cells: (Date | null)[] = Array(firstDow).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className={styles.datePicker}
      style={{ top: pos.top, left: pos.left }}
    >
      <div className={styles.datePickerQuick}>
        {QUICK_PICKS.map((q) => (
          <button key={q.label} className={styles.datePickerChip} onClick={() => quickPick(q.days)} type="button">
            {q.label}
          </button>
        ))}
      </div>

      <div className={styles.datePickerNav}>
        <button className={styles.datePickerNavBtn} onClick={() => setViewMonth(subMonths(viewMonth, 1))} type="button">
          <CaretLeft size={12} weight="bold" />
        </button>
        <span className={styles.datePickerMonthLabel}>{formatDate(viewMonth, "MMMM yyyy")}</span>
        <button className={styles.datePickerNavBtn} onClick={() => setViewMonth(addMonths(viewMonth, 1))} type="button">
          <CaretRight size={12} weight="bold" />
        </button>
      </div>

      <div className={styles.datePickerGrid}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <span key={d} className={styles.datePickerDow}>{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />;
          const dateStr = formatDate(day, "yyyy-MM-dd");
          const isToday = day.getTime() === today.getTime();
          const isSelected = dateStr === selectedDateStr;
          const isPast = day.getTime() < today.getTime();
          return (
            <button
              key={dateStr}
              type="button"
              className={`${styles.datePickerDay} ${isToday ? styles.datePickerDayToday : ""} ${isSelected ? styles.datePickerDaySelected : ""} ${isPast ? styles.datePickerDayPast : ""}`}
              onClick={() => onSelect(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8, 0, 0).toISOString())}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Follow-up cell — context-aware state machine
// ---------------------------------------------------------------------------

function FollowUpCell({
  clientId,
  followUpAt,
  nextMeeting,
}: {
  clientId: string;
  followUpAt: string | null;
  nextMeeting?: NextMeeting | null;
}) {
  const [picking, setPicking] = useState(false);
  const [current, setCurrent] = useState(followUpAt);
  const [, startTransition] = useTransition();
  const cellRef = useRef<HTMLDivElement>(null);

  const save = (iso: string | null) => {
    setCurrent(iso);
    setPicking(false);
    startTransition(async () => {
      await updateClientFields(clientId, { nextFollowUpAt: iso });
    });
  };

  const overdue = current ? isOverdue(current) : false;
  const overdueDays = current && overdue ? daysOverdue(current) : 0;
  const hasMeeting = !!nextMeeting;
  const meetingBeforeFollowUp = hasMeeting && current
    ? new Date(nextMeeting!.scheduledAt) < new Date(current)
    : false;

  const openPicker = () => setPicking(true);

  // Overdue: always urgent, regardless of whether a meeting exists
  if (current && overdue) {
    return (
      <div ref={cellRef} style={{ display: "contents" }}>
        <StripCell
          variant="red"
          icon={<Warning size={11} weight="bold" />}
          label="Follow-up"
          value={`${formatShortDate(current)} · ${overdueDays}d overdue`}
          actions={
            <>
              <button className={styles.stripMiniBtn} onClick={openPicker}>Reschedule</button>
              <button className={styles.stripMiniBtnSolid} onClick={() => save(null)}>Done</button>
            </>
          }
        />
        {picking && <DatePickerPopover anchorRef={cellRef} value={current} onSelect={save} onClose={() => setPicking(false)} />}
      </div>
    );
  }

  // Upcoming follow-up — contextualize relative to next meeting
  if (current) {
    const variant = hasMeeting && meetingBeforeFollowUp ? "neutral" : "amber";
    const sub = hasMeeting && meetingBeforeFollowUp
      ? `After ${formatShortDate(nextMeeting!.scheduledAt)} meeting`
      : hasMeeting
        ? `Before ${formatShortDate(nextMeeting!.scheduledAt)} meeting`
        : "Upcoming";
    const btnStyle = variant === "amber"
      ? { borderColor: "rgba(245,158,11,0.3)", color: "#b45309" }
      : undefined;
    return (
      <div ref={cellRef} style={{ display: "contents" }}>
        <StripCell
          variant={variant}
          icon={<Warning size={11} weight={variant === "amber" ? "fill" : "regular"} />}
          label="Follow-up"
          value={formatShortDate(current)}
          sub={sub}
          actions={
            <>
              <button className={styles.stripMiniBtn} style={btnStyle} onClick={openPicker}>Reschedule</button>
              <button className={styles.stripMiniBtnSolid} style={variant === "amber" ? { background: "rgba(245,158,11,0.1)", color: "#b45309" } : undefined} onClick={() => save(null)}>Done</button>
            </>
          }
        />
        {picking && <DatePickerPopover anchorRef={cellRef} value={current} onSelect={save} onClose={() => setPicking(false)} />}
      </div>
    );
  }

  // No follow-up set
  if (hasMeeting) {
    // Meeting is the next touchpoint — no urgency needed
    return (
      <div ref={cellRef} style={{ display: "contents" }}>
        <StripCell
          variant="neutral"
          icon={<CheckCircle size={11} weight="fill" />}
          label="Follow-up"
          value="Meeting is next"
          sub="No reminder set"
          actions={
            <button className={styles.stripMiniBtn} onClick={openPicker}>Add reminder</button>
          }
        />
        {picking && <DatePickerPopover anchorRef={cellRef} value={null} onSelect={save} onClose={() => setPicking(false)} />}
      </div>
    );
  }

  return (
    <div ref={cellRef} style={{ display: "contents" }}>
      <StripCell
        variant="neutral"
        icon={<Warning size={11} weight="regular" />}
        label="Follow-up"
        value="Not scheduled"
        actions={
          <button className={styles.stripMiniBtn} onClick={openPicker}>Set date</button>
        }
      />
      {picking && <DatePickerPopover anchorRef={cellRef} value={null} onSelect={save} onClose={() => setPicking(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function ClientDetailContent({
  client,
  adminProfiles,
  nextMeeting,
  children,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  nextMeeting: NextMeeting;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    rawTab && TAB_KEYS.includes(rawTab) ? (rawTab as TabKey) : "overview";

  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const main = shellRef.current?.closest("main");
    if (!main) return;
    const update = () => {
      if (shellRef.current) {
        shellRef.current.style.height = `${main.clientHeight}px`;
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(main);
    return () => ro.disconnect();
  }, []);

  // Live name state for header sync with sidebar editing
  const [displayFirst, setDisplayFirst] = useState(client.firstName ?? "");
  const [displayLast, setDisplayLast] = useState(client.lastName ?? "");
  const [editingNamePart, setEditingNamePart] = useState<"first" | "last" | null>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(client.avatarUrl ?? null);
  const nameEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNameChange = useCallback((first: string, last: string) => {
    setDisplayFirst(first);
    setDisplayLast(last);
  }, []);

  const handleNameEditStart = useCallback((part: "first" | "last") => {
    if (nameEditTimeoutRef.current) clearTimeout(nameEditTimeoutRef.current);
    setEditingNamePart(part);
  }, []);

  const handleNameEditEnd = useCallback(() => {
    nameEditTimeoutRef.current = setTimeout(() => setEditingNamePart(null), 120);
  }, []);

  // Determine last contact display
  const lastContactDate = client.lastActivityAt ? formatDateTimeWithDay(client.lastActivityAt) : null;
  const lastContactAgo = client.lastActivityAt ? relativeDays(client.lastActivityAt) : null;

  // Determine if strip has any overdue items
  const hasOverdue = client.nextFollowUpAt ? isOverdue(client.nextFollowUpAt) : false;

  return (
    <ClientNameContext.Provider value={{ firstName: displayFirst, lastName: displayLast, avatarUrl: displayAvatarUrl, setAvatarUrl: setDisplayAvatarUrl }}>
    <div ref={shellRef} className={styles.shell}>
      <div className={styles.leftColumn}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className={styles.header}>

          {/* Header grid: left contact block | right: pills + strip */}
          <div className={styles.headerGrid}>

            <div className={styles.contactBlock}>
              {displayAvatarUrl ? (
                <img src={displayAvatarUrl} alt={client.fullName} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>{getInitials(client.fullName)}</div>
              )}
              <div className={styles.nameBlock}>
                {client.companyName && (
                  <span className={styles.eyebrow}>{client.companyName}</span>
                )}
                <h1 className={styles.name}>
                  {(displayFirst || displayLast) ? (
                    <>
                      {displayFirst && (
                        <span className={editingNamePart === "first" ? styles.namePartEditing : ""}>{displayFirst}</span>
                      )}
                      {displayFirst && displayLast && " "}
                      {displayLast && (
                        <span className={editingNamePart === "last" ? styles.namePartEditing : ""}>{displayLast}</span>
                      )}
                    </>
                  ) : (
                    client.fullName || "—"
                  )}
                </h1>
                <div className={styles.contactStack}>
                  {client.email && (
                    <span className={styles.contactItem}>
                      <span className={styles.contactValue}>{client.email}</span>
                      <CopyButton value={client.email} />
                    </span>
                  )}
                  {client.phone && (
                    <span className={styles.contactItem}>
                      <span className={styles.contactValue}>{formatPhone(client.phone) ?? client.phone}</span>
                      <CopyButton value={client.phone} />
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.pillsRow}>
              <div className={styles.pill}>
                <span className={styles.pillHighlight}>{client.properties.length}</span>
                <span>{client.properties.length === 1 ? "Property" : "Properties"}</span>
              </div>
              <div className={styles.pillSep} />
              <div className={styles.pill}>
                <span className={styles.pillHighlight}>{formatRevenue(client.lifetimeRevenue)}</span>
                <span>Lifetime rev.</span>
              </div>
              <div className={styles.pillSep} />
              <StagePopover contactId={client.id} stage={client.lifecycleStage} />
            </div>

            <div className={`${styles.strip} ${hasOverdue ? styles.stripOverdue : ""}`}>
              <StripCell
                variant="neutral"
                icon={<Clock size={11} weight="regular" />}
                label="Last Contact"
                value={lastContactDate ?? "No activity yet"}
                sub={lastContactAgo && lastContactDate ? lastContactAgo : undefined}
              />
              <FollowUpCell clientId={client.id} followUpAt={client.nextFollowUpAt} nextMeeting={nextMeeting} />
              <StripCell
                variant={nextMeeting ? "green" : "neutral"}
                icon={<CalendarBlank size={11} weight={nextMeeting ? "duotone" : "regular"} />}
                label="Next Meeting"
                value={nextMeeting ? nextMeeting.title : "None scheduled"}
                sub={nextMeeting ? formatMeetingDate(nextMeeting.scheduledAt) : undefined}
                wide
              />
            </div>

          </div>
        </header>

        {/* ── Tab bar + content ─────────────────────────────────── */}
        <div className={styles.tabColumn}>
          <nav className={styles.tabBar} aria-label="Client sections">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={styles.tab}
                data-active={activeTab === tab.key ? "true" : "false"}
                onClick={() => router.replace(`?tab=${tab.key}`, { scroll: false })}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <main className={styles.content}>{children}</main>
        </div>
      </div>

      <ClientDetailSidebar
        client={client}
        adminProfiles={adminProfiles}
        onNameChange={handleNameChange}
        onNameEditStart={handleNameEditStart}
        onNameEditEnd={handleNameEditEnd}
      />
    </div>
    </ClientNameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function ClientDetailShell({
  client,
  adminProfiles,
  nextMeeting,
  children,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  nextMeeting: NextMeeting;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className={styles.shell} />}>
      <ClientDetailContent
        client={client}
        adminProfiles={adminProfiles}
        nextMeeting={nextMeeting}
      >
        {children}
      </ClientDetailContent>
    </Suspense>
  );
}
