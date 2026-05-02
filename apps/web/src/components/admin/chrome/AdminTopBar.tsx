"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flask, MagnifyingGlass, X } from "@phosphor-icons/react";
import { toggleShowTestDataAction } from "@/lib/admin/test-data";
import { derivePageTitle, type PageTitleInfo } from "@/lib/admin/derive-page-title";
import { CreateMenu } from "./CreateMenu";
import { useTopBarSlots } from "./TopBarSlotsContext";
import { NotificationBell } from "../notifications/NotificationBell";
import styles from "./AdminTopBar.module.css";

type Props = {
  showTestData?: boolean;
};

function ordinalSuffix(day: number): string {
  const rem100 = day % 100;
  if (rem100 >= 11 && rem100 <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function AdminClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  let dateNode: ReactNode = "Sat, Apr 12th, 2026";
  let timeStr = "12:00:00 AM";

  if (now) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    timeStr = `${displayHours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`;

    const day = now.getDate();
    const suffix = ordinalSuffix(day);
    const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
    const month = now.toLocaleDateString("en-US", { month: "short" });
    const year = now.getFullYear();

    dateNode = (
      <>
        {weekday}, {month} {day}
        <span className={styles.clockSuffix}>{suffix}</span>
        , {year}
      </>
    );
  }

  return (
    <div className={styles.clock} style={{ opacity: now ? 1 : 0 }} suppressHydrationWarning>
      <span className={styles.clockDate}>{dateNode}</span>
      <span className={styles.clockDivider} aria-hidden />
      <span className={styles.clockTime}>{timeStr}</span>
      <span className={styles.live} aria-hidden />
    </div>
  );
}

function AdminSearchPill() {
  function handleClick() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={styles.searchPill}
      aria-label="Open search"
    >
      <MagnifyingGlass size={14} weight="bold" />
      <span className={styles.searchPillLabel}>Search</span>
      <span className={styles.searchPillKbd}>⌘K</span>
    </button>
  );
}

function TestDataToggle({
  on,
  pending,
  onToggle,
}: {
  on: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onToggle}
      className={`${styles.testToggle} ${on ? styles.testToggleOn : styles.testToggleOff}`}
      aria-label={on ? "Test data visible — click to hide" : "Test data hidden — click to show"}
      title={on ? "Hide test data" : "Show test data"}
    >
      <Flask size={11} weight={on ? "fill" : "regular"} />
      <span>{on ? "Test On" : "Test Off"}</span>
      {on && <X size={9} weight="bold" style={{ opacity: 0.7 }} />}
    </button>
  );
}

export function AdminTopBar({ showTestData = false }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const fallback = useMemo(() => derivePageTitle(pathname), [pathname]);
  const [override, setOverride] = useState<PageTitleInfo | null>(null);
  const [pending, startTransition] = useTransition();
  const { centerSlot, searchOverride } = useTopBarSlots();

  useEffect(() => {
    const handler = (e: Event) => {
      setOverride((e as CustomEvent<PageTitleInfo | null>).detail ?? null);
    };
    window.addEventListener("admin:page-title", handler);
    return () => window.removeEventListener("admin:page-title", handler);
  }, []);

  const info = override ?? fallback;

  return (
    <header className={styles.root}>
      <div className={styles.titleWrap}>
        {info.backHref ? (
          <button
            type="button"
            className={styles.crumb}
            onClick={() => router.push(info.backHref!)}
          >
            ← {info.backLabel ?? "Back"}
          </button>
        ) : null}
        {info.title ? <div className={styles.title}>{info.title}</div> : null}
        {info.subtitle ? <div className={styles.sub}>{info.subtitle}</div> : null}
      </div>

      <div className={styles.right}>
        <div className={styles.clockRow}>
          <TestDataToggle
            on={showTestData}
            pending={pending}
            onToggle={() => startTransition(() => toggleShowTestDataAction())}
          />
          <AdminClock />
        </div>
        <div className={styles.utilities}>
          {centerSlot ? <div className={styles.centerInline}>{centerSlot}</div> : null}
          <div className={styles.compactUtils}>
            <CreateMenu placement="topbar" />
          </div>
          <NotificationBell
            onOpenTask={(taskId) => router.push(`/admin/tasks?task=${taskId}`)}
          />
          {searchOverride ? (
            <div className={styles.searchSlot}>{searchOverride}</div>
          ) : (
            <AdminSearchPill />
          )}
        </div>
      </div>
    </header>
  );
}
