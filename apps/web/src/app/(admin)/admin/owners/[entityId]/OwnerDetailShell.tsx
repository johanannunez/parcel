"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretDown, SignIn, ChatCircle } from "@phosphor-icons/react/dist/ssr";
import { PageTitle } from "@/components/admin/chrome/PageTitle";
import type {
  OwnerDetailData,
  OwnerDetailSwitcherRow,
} from "@/lib/admin/owner-detail-types";
import { formatMonthYear } from "@/lib/admin/owner-detail-types";
import type { OwnerStatus } from "@/lib/admin/owners-list";
import type { RailEvent } from "@/lib/admin/detail-rail";
import { DetailRightRail } from "@/components/admin/detail/DetailRightRail";
import styles from "./OwnerDetailShell.module.css";

type TabKey =
  | "overview"
  | "properties"
  | "financials"
  | "activity"
  | "files"
  | "settings";

const TAB_ORDER: TabKey[] = [
  "overview",
  "properties",
  "financials",
  "activity",
  "files",
  "settings",
];

const TAB_LABEL: Record<TabKey, string> = {
  overview: "Overview",
  properties: "Properties",
  financials: "Financials",
  activity: "Activity",
  files: "Files",
  settings: "Settings",
};

const STATUS_PILL_CLASS: Record<OwnerStatus, string> = {
  active: styles.statusActive,
  invited: styles.statusInvited,
  not_invited: styles.statusNone,
  setting_up: styles.statusSetup,
};

const STATUS_LABEL: Record<OwnerStatus, string> = {
  active: "Active",
  invited: "Invited",
  not_invited: "Not invited",
  setting_up: "Setting up",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #02AAEB, #1B77BE)",
  "linear-gradient(135deg, #8A9AAB, #3C5266)",
  "linear-gradient(135deg, #F59E0B, #B45309)",
  "linear-gradient(135deg, #10B981, #047857)",
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
  "linear-gradient(135deg, #EF4444, #B91C1C)",
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function OwnerDetailShell({
  data,
  children,
  initialRailEvents = [],
  realtimeId,
}: {
  data: OwnerDetailData;
  children: ReactNode;
  initialRailEvents?: RailEvent[];
  realtimeId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams?.get("tab");
  const activeTab: TabKey =
    rawTab && (TAB_ORDER as readonly string[]).includes(rawTab)
      ? (rawTab as TabKey)
      : "overview";

  const { entity, primaryMember, propertyCount, status, switcher } = data;

  // Title / subtitle into the admin top bar.
  const subtitle = useMemo(() => {
    const pieces: string[] = [primaryMember.fullName];
    if (propertyCount > 0) {
      pieces.push(
        `${propertyCount} propert${propertyCount === 1 ? "y" : "ies"}`,
      );
    } else {
      pieces.push("No properties yet");
    }
    const joined = formatMonthYear(primaryMember.createdAt);
    if (joined) pieces.push(`Owner since ${joined}`);
    return pieces.join(" \u00b7 ");
  }, [primaryMember.fullName, primaryMember.createdAt, propertyCount]);

  useEffect(() => {
    document.title = `${entity.name} \u00b7 Owner \u00b7 Parcel Admin`;
  }, [entity.name, activeTab]);

  function switchTab(next: TabKey) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(`/admin/owners/${entity.id}${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <div className={styles.root}>
      <PageTitle
        title={entity.name}
        subtitle={subtitle}
        backHref="/admin/owners"
        backLabel="Owners"
      />

      <IdentityBand
        entityId={entity.id}
        entityName={entity.name}
        primaryMember={primaryMember}
        status={status}
        switcher={switcher}
      />

      <nav className={styles.tabs} role="tablist" aria-label="Owner sections">
        {TAB_ORDER.map((key) => {
          const isActive = activeTab === key;
          const label = TAB_LABEL[key];
          const showCount = key === "properties" && propertyCount > 0;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => switchTab(key)}
            >
              {label}
              {showCount ? (
                <span className={styles.tabCount}>{propertyCount}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div
        className={
          activeTab === "settings" || !realtimeId
            ? styles.content
            : styles.contentWithRail
        }
      >
        <div className={styles.mainCol}>{children}</div>
        {activeTab !== "settings" && realtimeId ? (
          <DetailRightRail
            parentType="contact"
            realtimeId={realtimeId}
            initialEvents={initialRailEvents}
            metadata={[
              ...(data.source ? [{ label: "Source", value: data.source }] : []),
              ...(data.assignedToName
                ? [{ label: "Owner", value: data.assignedToName }]
                : []),
              { label: "Created", value: formatMonthYear(data.entity.createdAt) },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

// --- Identity band ---------------------------------------------------

function IdentityBand({
  entityId,
  entityName,
  primaryMember,
  status,
  switcher,
}: {
  entityId: string;
  entityName: string;
  primaryMember: OwnerDetailData["primaryMember"];
  status: OwnerStatus;
  switcher: OwnerDetailSwitcherRow[];
}) {
  const router = useRouter();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!switcherOpen) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setSwitcherOpen(false);
        setSearch("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSwitcherOpen(false);
        setSearch("");
      }
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [switcherOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return switcher;
    return switcher.filter((s) => s.name.toLowerCase().includes(q));
  }, [search, switcher]);

  const subParts: string[] = [];
  if (primaryMember.email) subParts.push(primaryMember.email);
  if (primaryMember.phone) subParts.push(primaryMember.phone);

  // Primary CTA depends on status
  const ctaLabel =
    status === "not_invited"
      ? "Invite owner"
      : status === "invited"
        ? "Resend invite"
        : "Schedule check-in";

  return (
    <div className={styles.band}>
      <div
        className={styles.avatar}
        style={{ background: gradientFor(entityId) }}
      >
        {primaryMember.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryMember.avatarUrl} alt="" />
        ) : (
          initials(entityName)
        )}
      </div>

      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{entityName}</span>
          <div className={styles.switcherWrap} ref={wrapRef}>
            <button
              type="button"
              aria-label="Switch owner"
              aria-expanded={switcherOpen}
              className={`${styles.switcherBtn} ${switcherOpen ? styles.switcherBtnOpen : ""}`}
              onClick={() => setSwitcherOpen((v) => !v)}
            >
              <CaretDown size={11} weight="bold" />
            </button>
            {switcherOpen ? (
              <div className={styles.switcherMenu} role="menu">
                <input
                  type="text"
                  className={styles.switcherSearch}
                  placeholder="Jump to owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {filtered.length === 0 ? (
                  <div className={styles.switcherEmpty}>
                    No owners match &ldquo;{search}&rdquo;.
                  </div>
                ) : (
                  filtered.map((row) => {
                    const isActive = row.id === entityId;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        role="menuitem"
                        className={`${styles.switcherItem} ${isActive ? styles.switcherItemActive : ""}`}
                        onClick={() => {
                          setSwitcherOpen(false);
                          setSearch("");
                          router.push(`/admin/owners/${row.id}`);
                        }}
                      >
                        <span
                          className={styles.switcherThumb}
                          style={{ background: gradientFor(row.id) }}
                        >
                          {initials(row.name)}
                        </span>
                        <span className={styles.switcherText}>
                          <span className={styles.switcherName}>
                            {row.name}
                          </span>
                          <span className={styles.switcherSub}>
                            {row.propertyCount === 0
                              ? "No properties"
                              : row.propertyCount === 1
                                ? "1 property"
                                : `${row.propertyCount} properties`}
                            {" \u00b7 "}
                            {STATUS_LABEL[row.status]}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
          <span
            className={`${styles.statusPill} ${STATUS_PILL_CLASS[status]}`}
          >
            <span className={styles.dot} />
            {STATUS_LABEL[status]}
          </span>
        </div>

        {subParts.length > 0 ? (
          <div className={styles.sub}>
            {subParts.map((part, idx) => (
              <span key={`${part}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {idx > 0 ? <span className={styles.separator} aria-hidden /> : null}
                <span>{part}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => {
            // TODO: hook up real impersonation in a later dispatch
            window.alert(
              "Impersonation will be wired up in the Settings + Account system plan.",
            );
          }}
        >
          <SignIn size={14} weight="bold" />
          Impersonate
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => router.push(`/admin/inbox?owner=${primaryMember.id}`)}
        >
          <ChatCircle size={14} weight="bold" />
          Message
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("admin:create-open", {
                detail: { kind: status === "not_invited" ? "owner" : "meeting" },
              }),
            );
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
