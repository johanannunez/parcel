"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageTitle } from "@/components/admin/chrome/PageTitle";
import styles from "./PropertyDetailShell.module.css";

type TabKey = "overview" | "tasks";

const TAB_ORDER: TabKey[] = ["overview", "tasks"];

const TAB_LABEL: Record<TabKey, string> = {
  overview: "Overview",
  tasks: "Tasks",
};

export function PropertyDetailShell({
  id,
  label,
  city,
  state,
  children,
}: {
  id: string;
  label: string;
  city: string;
  state: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams?.get("tab");
  const activeTab: TabKey =
    rawTab && (TAB_ORDER as readonly string[]).includes(rawTab)
      ? (rawTab as TabKey)
      : "overview";

  useEffect(() => {
    document.title = `${label} \u00b7 Property \u00b7 Parcel Admin`;
  }, [label]);

  function switchTab(next: TabKey) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(`/admin/properties/${id}${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  }

  const subtitle = [label, city && state ? `${city}, ${state}` : null]
    .filter(Boolean)
    .join(" \u00b7 ");

  return (
    <div className={styles.root}>
      <PageTitle
        title={label}
        subtitle={subtitle}
        backHref="/admin/properties"
        backLabel="Properties"
      />

      <nav className={styles.tabs} role="tablist" aria-label="Property sections">
        {TAB_ORDER.map((key) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => switchTab(key)}
            >
              {TAB_LABEL[key]}
            </button>
          );
        })}
      </nav>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
