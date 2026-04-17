"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RocketLaunch } from "@phosphor-icons/react";
import styles from "./StatusButton.module.css";

export function StatusButton({
  active,
  href,
}: {
  active: boolean;
  href: string;
}) {
  const [firing, setFiring] = useState(false);

  // Clear the firing state once we land on the Status page.
  useEffect(() => {
    if (active) setFiring(false);
  }, [active]);

  // Safety clear in case navigation never completes.
  useEffect(() => {
    if (!firing) return;
    const id = setTimeout(() => setFiring(false), 4000);
    return () => clearTimeout(id);
  }, [firing]);

  const handleClick = () => {
    if (active) return;
    setFiring(true);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`${styles.btn} ${active ? styles.btnActive : ""} ${firing ? styles.btnFiring : ""}`}
      aria-current={active ? "page" : undefined}
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
