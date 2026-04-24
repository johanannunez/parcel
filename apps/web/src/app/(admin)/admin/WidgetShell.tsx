'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import styles from './WidgetShell.module.css';

type Props = {
  label: string;
  icon?: ReactNode;
  count?: number | string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
};

export function WidgetShell({
  label,
  icon,
  count,
  href,
  hrefLabel = 'View all',
  children,
  className,
}: Props) {
  return (
    <motion.div
      className={`${styles.shell} ${className ?? ''}`}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <div className={styles.header}>
        {icon && <span className={styles.headerIcon}>{icon}</span>}
        <span className={styles.headerLabel}>{label}</span>
        {count !== undefined && (
          <span className={styles.headerCount}>{count}</span>
        )}
        {href && count === undefined && (
          <Link href={href} className={styles.headerAction}>
            {hrefLabel} →
          </Link>
        )}
      </div>
      <div className={styles.body}>{children}</div>
      {href && count !== undefined && (
        <div className={styles.footer}>
          <Link href={href} className={styles.headerAction}>
            {hrefLabel} →
          </Link>
        </div>
      )}
    </motion.div>
  );
}
