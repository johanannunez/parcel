'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { StatusCardData } from './pipeline-types';
import { AiInsightCard } from './AiInsightCard';
import styles from './ContactStatusCard.module.css';

export function ContactStatusCard({ card }: { card: StatusCardData }) {
  const primaryAssignee = card.assigneeAvatars[0];

  return (
    <Link href={card.href} className={styles.card}>
      <div className={styles.top}>
        <span className={styles.avatar} aria-hidden>
          {getInitials(card.name)}
        </span>
        <div className={styles.identity}>
          <div className={styles.name}>{card.name}</div>
          {card.subline ? (
            <div className={styles.sub}>{card.subline}</div>
          ) : null}
        </div>
        {card.stageBadge ? (
          <span className={styles.stageBadge}>{card.stageBadge}</span>
        ) : null}
      </div>

      {card.stats.length > 0 ? (
        <div className={styles.meta}>
          {card.stats.map((s, i) => (
            <span key={i} className={styles.metaItem}>
              <span className={styles.metaLabel}>{s.label}</span>
              <span className={styles.metaValue}>{s.value}</span>
            </span>
          ))}
          {primaryAssignee ? (
            <span className={styles.assignee} title={primaryAssignee.label}>
              {primaryAssignee.src ? (
                <Image
                  src={primaryAssignee.src}
                  alt={primaryAssignee.label ?? ''}
                  width={20}
                  height={20}
                  className={styles.assigneeImg}
                />
              ) : (
                <span className={styles.assigneeFallback}>
                  {primaryAssignee.initials}
                </span>
              )}
            </span>
          ) : null}
        </div>
      ) : null}

      {card.insight ? <AiInsightCard insight={card.insight} /> : null}
    </Link>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
