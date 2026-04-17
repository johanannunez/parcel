"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { RocketLaunch } from "@phosphor-icons/react";
import styles from "./StatusButton.module.css";

export function StatusButton({
  active,
  pending,
  href,
  onNavigate,
}: {
  active: boolean;
  pending?: boolean;
  href: string;
  onNavigate?: () => void;
}) {
  const [localFiring, setLocalFiring] = useState(false);

  // Clear the local firing state once navigation settles on Status.
  useEffect(() => {
    if (active && !pending) setLocalFiring(false);
  }, [active, pending]);

  // Safety clear in case navigation never lands.
  useEffect(() => {
    if (!localFiring) return;
    const id = setTimeout(() => setLocalFiring(false), 4000);
    return () => clearTimeout(id);
  }, [localFiring]);

  const firing = pending || localFiring;
  const activeState = active && !pending;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (activeState) return;
    // Allow right-click / cmd-click / middle-click to fall back to the
    // native Link behavior (open in new tab, copy URL, etc.). For a plain
    // left-click we hand off to the nav context so useTransition can cover
    // the render wait with a skeleton.
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    setLocalFiring(true);
    onNavigate?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`${styles.btn} ${activeState ? styles.btnActive : ""} ${firing ? styles.btnFiring : ""}`}
      aria-current={activeState ? "page" : undefined}
      aria-busy={firing || undefined}
    >
      <span className={styles.iconWrap}>
        <RocketLaunch size={14} weight="duotone" className={styles.icon} />
        <span className={styles.trail} aria-hidden />
      </span>
      <span className={styles.label}>Status</span>
      <span className={styles.shine} aria-hidden />
    </Link>
  );
}
