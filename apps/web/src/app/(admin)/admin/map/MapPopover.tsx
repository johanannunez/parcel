'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X } from '@phosphor-icons/react';
import { initials, stageColor, stageLabel } from '@/lib/admin/lifecycle-stage';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import styles from './MapPopover.module.css';

type Props = {
  kind: 'owner' | 'property';
  name: string;
  sub: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  lifecycleStage: LifecycleStage;
  address?: string;
  addressSub?: string | null;
  meta?: string | null;
  ctaLabel: string;
  ctaHref: string;
  onClose: () => void;
};

export function MapPopover({
  name,
  sub,
  avatarUrl,
  avatarColor,
  lifecycleStage,
  address,
  addressSub,
  meta,
  ctaLabel,
  ctaHref,
  onClose,
}: Props) {
  const color = stageColor(lifecycleStage);

  return (
    <div className={styles.popover} style={{ position: 'relative' }}>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
        <X size={12} weight="bold" />
      </button>

      <div className={styles.header}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={36} height={36} className={styles.avatar} />
        ) : (
          <div className={styles.avatarFallback} style={{ background: avatarColor }}>
            {initials(name)}
          </div>
        )}
        <div className={styles.headerText}>
          <div className={styles.name}>{name}</div>
          {sub ? <div className={styles.sub}>{sub}</div> : null}
        </div>
      </div>

      <span
        className={styles.stagePill}
        style={{ background: `${color}1f`, color }}
      >
        {stageLabel(lifecycleStage)}
      </span>

      {address ? (
        <div className={styles.address}>
          {address}
          {addressSub ? <div>{addressSub}</div> : null}
        </div>
      ) : null}

      {meta ? <div className={styles.meta}>{meta}</div> : null}

      <Link href={ctaHref} className={styles.cta}>
        {ctaLabel}
      </Link>
    </div>
  );
}
