"use client";

import { useState, Suspense, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CopySimple,
  ChatCircleDots,
  CalendarBlank,
  Warning,
} from "@phosphor-icons/react";
import type { ClientDetail } from "@/lib/admin/client-detail";
import type { AdminProfile } from "./client-actions";
import { updateClientFields } from "./client-actions";
import { ClientStagePill } from "./ClientStagePill";
import { ClientDetailSidebar } from "./ClientDetailSidebar";
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
// Helper functions
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
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

function formatRevenue(cents: number | null): string {
  if (cents === null || cents === 0) return "$0";
  const k = cents / 100;
  if (k >= 1000) return `$${(k / 1000).toFixed(1)}k`;
  return `$${k.toFixed(0)}`;
}

function formatFollowUpDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
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
    } catch {
      // clipboard API may fail silently
    }
  };

  return (
    <button
      type="button"
      className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`}
      onClick={handleCopy}
      aria-label={`Copy ${value}`}
      title={copied ? "Copied!" : "Copy"}
    >
      <CopySimple size={13} weight="bold" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stat chip
// ---------------------------------------------------------------------------

function StatChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.statChip}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Follow-up chip
// ---------------------------------------------------------------------------

function FollowUpChip({
  clientId,
  initialFollowUp,
}: {
  clientId: string;
  initialFollowUp: string | null;
}) {
  const [followUp, setFollowUp] = useState(initialFollowUp);
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const saveFollowUp = (iso: string | null) => {
    setFollowUp(iso);
    setEditing(false);
    startTransition(async () => {
      await updateClientFields(clientId, { nextFollowUpAt: iso });
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      saveFollowUp(null);
    } else {
      saveFollowUp(new Date(val + "T00:00:00").toISOString());
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentDateStr = followUp ? followUp.slice(0, 10) : "";
  const overdue = followUp ? isOverdue(followUp) : false;

  if (editing) {
    return (
      <div className={styles.followUpPopover}>
        <Warning size={13} weight="bold" className={styles.followUpPopoverIcon} />
        <input
          type="date"
          className={styles.followUpDateInput}
          defaultValue={currentDateStr || todayStr}
          autoFocus
          onChange={handleDateChange}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
        />
      </div>
    );
  }

  if (followUp) {
    return (
      <button
        type="button"
        className={`${styles.followUpChip} ${overdue ? styles.followUpChipOverdue : ""}`}
        onClick={() => setEditing(true)}
        title="Click to change follow-up date"
      >
        <Warning size={12} weight="bold" />
        Follow-up: {formatFollowUpDate(followUp)}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.followUpAdd}
      onClick={() => setEditing(true)}
    >
      + Follow-up
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams, must be wrapped in Suspense)
// ---------------------------------------------------------------------------

function ClientDetailContent({
  client,
  adminProfiles,
  children,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    rawTab && TAB_KEYS.includes(rawTab) ? (rawTab as TabKey) : "overview";

  const daysInStage = Math.floor(
    (Date.now() - new Date(client.stageChangedAt).getTime()) / 86400_000
  );
  const daysInStageStr =
    daysInStage < 1
      ? "today"
      : daysInStage < 30
      ? `${daysInStage}d`
      : `${Math.floor(daysInStage / 30)}mo`;

  return (
    <div className={styles.shell}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        {/* Left zone: avatar + name block */}
        <div className={styles.identity}>
          {client.avatarUrl ? (
            <img
              src={client.avatarUrl}
              alt={client.fullName}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {getInitials(client.fullName)}
            </div>
          )}

          <div className={styles.nameBlock}>
            <h1 className={styles.name}>{client.fullName}</h1>
            {client.companyName && (
              <p className={styles.company}>{client.companyName}</p>
            )}
            <div className={styles.contactRow}>
              {client.email && (
                <span className={styles.contactItem}>
                  <span className={styles.contactValue}>{client.email}</span>
                  <CopyButton value={client.email} />
                </span>
              )}
              {client.email && client.phone && (
                <span className={styles.dot} aria-hidden>·</span>
              )}
              {client.phone && (
                <span className={styles.contactItem}>
                  <span className={styles.contactValue}>{client.phone}</span>
                  <CopyButton value={client.phone} />
                </span>
              )}
            </div>
            <FollowUpChip
              clientId={client.id}
              initialFollowUp={client.nextFollowUpAt}
            />
          </div>
        </div>

        {/* Right zone: stat chips + action buttons */}
        <div className={styles.headerRight}>
          <div className={styles.statChips}>
            <StatChip
              label="Properties"
              value={`${client.properties.length} managed`}
            />
            <StatChip
              label="Revenue"
              value={formatRevenue(client.lifetimeRevenue)}
            />
            <StatChip
              label="In Stage"
              value={daysInStageStr}
            />
            <StatChip
              label="Last"
              value={relativeDays(client.lastActivityAt)}
            />
          </div>

          <div className={styles.headerActions}>
            <ClientStagePill stage={client.lifecycleStage} />
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() =>
                router.replace("?tab=messaging", { scroll: false })
              }
            >
              <ChatCircleDots size={15} weight="bold" />
              Message
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() =>
                router.replace("?tab=meetings", { scroll: false })
              }
            >
              <CalendarBlank size={15} weight="bold" />
              Meeting
            </button>
          </div>
        </div>
      </header>

      {/* ── Body: tab column + sidebar ───────────────────────────────────── */}
      <div className={styles.body}>
        {/* Left: tab bar + content */}
        <div className={styles.tabColumn}>
          <nav className={styles.tabBar} aria-label="Client sections">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={styles.tab}
                data-active={activeTab === tab.key ? "true" : "false"}
                onClick={() =>
                  router.replace(`?tab=${tab.key}`, { scroll: false })
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <main className={styles.content}>{children}</main>
        </div>

        {/* Right: sidebar */}
        <ClientDetailSidebar client={client} adminProfiles={adminProfiles} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export (wraps in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export function ClientDetailShell({
  client,
  adminProfiles,
  children,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className={styles.shell} />}>
      <ClientDetailContent
        client={client}
        adminProfiles={adminProfiles}
      >
        {children}
      </ClientDetailContent>
    </Suspense>
  );
}
