"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PencilSimple } from "@phosphor-icons/react";
import type { ClientDetail } from "@/lib/admin/client-detail";
import { ClientStagePill } from "./ClientStagePill";
import { ClientEditDrawer } from "./ClientEditDrawer";
import styles from "./ClientDetailShell.module.css";

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
  { key: "overview",     label: "Overview"     },
  { key: "properties",   label: "Properties"   },
  { key: "meetings",     label: "Meetings"     },
  { key: "intelligence", label: "Intelligence" },
  { key: "messaging",    label: "Messaging"    },
  { key: "documents",    label: "Documents"    },
  { key: "billing",      label: "Billing"      },
  { key: "settings",     label: "Settings"     },
];

const TAB_KEYS = TABS.map((t) => t.key) as readonly string[];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ClientDetailShell({
  client,
  children,
}: {
  client: ClientDetail;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    rawTab && TAB_KEYS.includes(rawTab) ? (rawTab as TabKey) : "overview";

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
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
              {client.email && <span>{client.email}</span>}
              {client.email && client.phone && (
                <span className={styles.dot} aria-hidden>·</span>
              )}
              {client.phone && <span>{client.phone}</span>}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <ClientStagePill stage={client.lifecycleStage} />
          <button
            className={styles.editBtn}
            onClick={() => setDrawerOpen(true)}
          >
            <PencilSimple size={15} weight="bold" />
            Edit
          </button>
        </div>
      </header>

      <nav className={styles.tabBar} aria-label="Client sections">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`?tab=${tab.key}`}
            className={styles.tab}
            data-active={activeTab === tab.key ? "true" : "false"}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <main className={styles.content}>{children}</main>

      <ClientEditDrawer
        client={client}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
