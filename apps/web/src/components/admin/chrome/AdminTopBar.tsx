"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Question, Bell } from "@phosphor-icons/react";
import { derivePageTitle, type PageTitleInfo } from "@/lib/admin/derive-page-title";
import { TopBarSearch } from "./TopBarSearch";
import { CreateMenu } from "./CreateMenu";
import styles from "./AdminTopBar.module.css";

type Props = { notificationCount?: number };

export function AdminTopBar({ notificationCount = 0 }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const fallback = useMemo(() => derivePageTitle(pathname), [pathname]);
  const [override, setOverride] = useState<PageTitleInfo | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const handler = (e: Event) => {
      setOverride((e as CustomEvent<PageTitleInfo | null>).detail ?? null);
    };
    window.addEventListener("admin:page-title", handler);
    return () => window.removeEventListener("admin:page-title", handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const info = override ?? fallback;

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });

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
        {/* Search + Create — only visible below 1024px (desktop has them in the sidebar). */}
        <div className={styles.compactUtils}>
          <TopBarSearch />
          <CreateMenu placement="topbar" />
        </div>

        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Help Center"
          onClick={() => router.push("/admin/help")}
        >
          <Question size={16} weight="duotone" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={16} weight="duotone" />
          {notificationCount > 0 ? (
            <span className={styles.badge}>{notificationCount > 9 ? "9+" : notificationCount}</span>
          ) : null}
        </button>
        <div className={styles.clock} aria-live="off">
          <div className={styles.clockDate}>{dateLabel}</div>
          <div className={styles.clockTime}>
            <span className={styles.live} />
            {timeLabel}
          </div>
        </div>
      </div>
    </header>
  );
}
