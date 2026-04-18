"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  CalendarCheck,
  Clock,
  ArrowRight,
  User,
  Buildings,
  CurrencyDollar,
  Chat,
  Files,
} from "@phosphor-icons/react";
import type { AdminNotificationsResponse } from "@/app/api/admin/notifications/route";
import styles from "./NotificationPopover.module.css";

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CategoryIcon({ category }: { category: string }) {
  const size = 14;
  switch (category) {
    case "financial": return <CurrencyDollar size={size} weight="duotone" />;
    case "property": return <Buildings size={size} weight="duotone" />;
    case "calendar": return <CalendarCheck size={size} weight="duotone" />;
    case "communication": return <Chat size={size} weight="duotone" />;
    case "document": return <Files size={size} weight="duotone" />;
    case "account": return <User size={size} weight="duotone" />;
    default: return <Clock size={size} weight="duotone" />;
  }
}

export function NotificationPopover() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminNotificationsResponse | null>(null);

  useEffect(() => setMounted(true), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const toggle = () =>
      setOpen((prev) => {
        if (!prev) fetchData();
        return !prev;
      });
    window.addEventListener("admin:notifications-toggle", toggle);
    return () => window.removeEventListener("admin:notifications-toggle", toggle);
  }, [fetchData]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  if (!mounted || !open) return null;

  const hasContent =
    data && (data.blockRequests.length > 0 || data.recentActivity.length > 0);

  const content = (
    <>
      <div
        className={styles.scrim}
        onMouseDown={() => setOpen(false)}
      />
      <div className={styles.popover} role="dialog" aria-label="Notifications">
        <div className={styles.header}>
          <span className={styles.headerTitle}>Notifications</span>
        </div>

        <div className={styles.body}>
          {loading ? (
            <>
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Reservations to verify</div>
                <div className={styles.shimmer} />
                <div className={styles.shimmer} />
              </div>
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Recent activity</div>
                <div className={styles.shimmer} />
                <div className={styles.shimmer} />
              </div>
            </>
          ) : !hasContent ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <CheckCircle size={20} weight="duotone" />
              </div>
              <div className={styles.emptyTitle}>All caught up</div>
              <div className={styles.emptySub}>Nothing needs your attention right now.</div>
            </div>
          ) : (
            <>
              {(data?.blockRequests.length ?? 0) > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>
                    Reservations to verify ({data!.blockRequests.length})
                  </div>
                  <ul className={styles.list}>
                    {data!.blockRequests.map((req) => (
                      <li key={req.id}>
                        <button
                          type="button"
                          className={styles.row}
                          onClick={() => navigate("/admin/block-requests")}
                        >
                          <div className={`${styles.rowIconWrap} ${styles.rowIconWrapOrange}`}>
                            <CalendarCheck size={14} weight="duotone" />
                          </div>
                          <div className={styles.rowBody}>
                            <div className={styles.rowTitle}>
                              {req.ownerName ?? "Owner"} &middot; {req.propertyLabel}
                            </div>
                            <div className={styles.rowMeta}>
                              {formatDateRange(req.startDate, req.endDate)}
                            </div>
                            <div className={styles.rowDate}>{timeAgo(req.createdAt)}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(data?.recentActivity.length ?? 0) > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>Recent activity</div>
                  <ul className={styles.list}>
                    {data!.recentActivity.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={styles.row}
                          onClick={() => navigate("/admin/timeline")}
                        >
                          <div className={`${styles.rowIconWrap} ${styles.rowIconWrapBlue}`}>
                            <CategoryIcon category={item.category} />
                          </div>
                          <div className={styles.rowBody}>
                            <div className={styles.rowTitle}>{item.title}</div>
                            {item.body ? (
                              <div className={styles.rowMeta}>{item.body}</div>
                            ) : null}
                            <div className={styles.rowDate}>{timeAgo(item.createdAt)}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => navigate("/admin/timeline")}
            >
              View all activity
              <ArrowRight size={12} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
