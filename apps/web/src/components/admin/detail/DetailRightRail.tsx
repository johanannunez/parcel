"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RailEvent } from "@/lib/admin/detail-rail";
import styles from "./DetailRightRail.module.css";

type Props = {
  /** Logical parent type — controls the Realtime filter column. */
  parentType: "contact" | "property" | "project";
  /**
   * The column value used for the Realtime filter.
   * For contacts pass the profile_id (NOT the contacts.id) so it matches
   * owner_timeline.owner_id directly.
   * For properties pass the property UUID.
   */
  realtimeId: string;
  initialEvents: RailEvent[];
  metadata?: Array<{ label: string; value: string }>;
};

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function DetailRightRail({
  parentType,
  realtimeId,
  initialEvents,
  metadata = [],
}: Props) {
  const [events, setEvents] = useState<RailEvent[]>(initialEvents);

  useEffect(() => {
    if (!realtimeId) return;

    // owner_timeline currently has `owner_id` and `property_id` but no
    // `project_id` column. Skip the Realtime subscription for projects and
    // rely on the initial fetch until a project column exists.
    if (parentType === "project") return;

    const supabase = createClient();
    const filterColumn: "property_id" | "owner_id" =
      parentType === "property" ? "property_id" : "owner_id";

    const channel = supabase
      .channel(`rail:${parentType}:${realtimeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "owner_timeline",
          filter: `${filterColumn}=eq.${realtimeId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const ev: RailEvent = {
            id: row.id as string,
            at: row.created_at as string,
            actorName: null,
            summary: (row.title as string | null) ?? (row.event_type as string | null) ?? "Event",
            kind: (row.event_type as string | null) ?? "note",
          };
          setEvents((prev) => [ev, ...prev].slice(0, 12));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parentType, realtimeId]);

  return (
    <aside className={styles.rail} aria-label="Recent activity">
      <header className={styles.head}>
        <span>ACTIVITY</span>
        <span className={styles.live}>LIVE</span>
      </header>

      <div className={styles.events}>
        {events.length === 0 ? (
          <div className={styles.empty}>No recent activity.</div>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className={styles.ev}>
              <span className={styles.dot} aria-hidden />
              <div className={styles.evBody}>
                <div className={styles.evText}>{ev.summary}</div>
                <div className={styles.evMeta}>
                  {relative(ev.at)}
                  {ev.actorName ? ` \u00b7 ${ev.actorName}` : ""}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {metadata.length > 0 ? (
        <footer className={styles.meta}>
          {metadata.map((m) => (
            <div key={m.label} className={styles.metaRow}>
              <span className={styles.metaLabel}>{m.label}</span>
              <span className={styles.metaValue}>{m.value}</span>
            </div>
          ))}
        </footer>
      ) : null}
    </aside>
  );
}
