"use client";

import { useState, Suspense, useTransition, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CopySimple,
  Warning,
  Clock,
  CalendarBlank,
} from "@phosphor-icons/react";
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
  | "meetings"
  | "intelligence"
  | "messaging"
  | "documents"
  | "billing"
  | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview",     label: "Overview"      },
  { key: "properties",   label: "Properties"    },
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

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMeetingDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.ceil((d.getTime() - Date.now()) / 86400_000);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateStr} at ${timeStr} · ${days === 1 ? "tomorrow" : `${days} days`}`;
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
}: {
  variant: CellVariant;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={`${styles.stripCell} ${styles[`stripCell_${variant}`]}`}>
      <div className={styles.stripCellHead}>
        <span className={styles[`stripCellIconColor_${variant}` as keyof typeof styles]}>
          {icon}
        </span>
        <span className={styles.stripCellLabel}>{label}</span>
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
// Follow-up cell with inline state machine
// ---------------------------------------------------------------------------

function FollowUpCell({ clientId, followUpAt }: { clientId: string; followUpAt: string | null }) {
  const [state, setState] = useState<"idle" | "rescheduling">("idle");
  const [current, setCurrent] = useState(followUpAt);
  const [, startTransition] = useTransition();

  const save = (iso: string | null) => {
    setCurrent(iso);
    setState("idle");
    startTransition(async () => {
      await updateClientFields(clientId, { nextFollowUpAt: iso });
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    save(val ? new Date(val + "T00:00:00").toISOString() : null);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentDateStr = current ? current.slice(0, 10) : "";
  const overdue = current ? isOverdue(current) : false;
  const overdueDays = current && overdue ? daysOverdue(current) : 0;

  if (state === "rescheduling") {
    return (
      <StripCell
        variant="amber"
        icon={<Warning size={14} weight="bold" />}
        label="Follow-up"
        value={
          <input
            type="date"
            className={styles.followUpDateInput}
            defaultValue={currentDateStr || todayStr}
            autoFocus
            onChange={handleDateChange}
            onBlur={() => setState("idle")}
            onKeyDown={(e) => { if (e.key === "Escape") setState("idle"); }}
          />
        }
      />
    );
  }

  if (current && overdue) {
    return (
      <StripCell
        variant="red"
        icon={<Warning size={14} weight="bold" />}
        label="Follow-up"
        value={`${formatShortDate(current)} · ${overdueDays}d overdue`}
        actions={
          <>
            <button className={styles.stripMiniBtn} onClick={() => setState("rescheduling")}>Reschedule</button>
            <button className={styles.stripMiniBtnSolid} onClick={() => save(null)}>Done</button>
          </>
        }
      />
    );
  }

  if (current) {
    return (
      <StripCell
        variant="amber"
        icon={<Warning size={14} weight="fill" />}
        label="Follow-up"
        value={formatShortDate(current)}
        sub="Upcoming"
        actions={
          <button className={styles.stripMiniBtn} style={{ borderColor: "rgba(245,158,11,0.3)", color: "#b45309" }} onClick={() => setState("rescheduling")}>Change</button>
        }
      />
    );
  }

  return (
    <StripCell
      variant="neutral"
      icon={<Warning size={14} weight="regular" />}
      label="Follow-up"
      value="Not scheduled"
      actions={
        <button className={styles.stripMiniBtn} onClick={() => setState("rescheduling")}>Set date</button>
      }
    />
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
  const lastContactDate = client.lastActivityAt ? formatShortDate(client.lastActivityAt) : null;
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
                <span>{client.properties.length === 1 ? "property" : "properties"}</span>
              </div>
              <div className={styles.pillSep} />
              <div className={styles.pill}>
                <span className={styles.pillHighlight}>{formatRevenue(client.lifetimeRevenue)}</span>
                <span>lifetime rev.</span>
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
              <FollowUpCell clientId={client.id} followUpAt={client.nextFollowUpAt} />
              <StripCell
                variant={nextMeeting ? "green" : "neutral"}
                icon={<CalendarBlank size={11} weight={nextMeeting ? "duotone" : "regular"} />}
                label="Next Meeting"
                value={nextMeeting ? nextMeeting.title : "None scheduled"}
                sub={nextMeeting ? formatMeetingDate(nextMeeting.scheduledAt) : undefined}
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
