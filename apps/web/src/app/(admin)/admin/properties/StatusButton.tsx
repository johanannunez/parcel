"use client";

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
  return (
    <Link
      href={href}
      className={`${styles.btn} ${active ? styles.btnActive : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <RocketLaunch size={14} weight="duotone" className={styles.icon} />
      <span className={styles.label}>Status</span>
    </Link>
  );
}
