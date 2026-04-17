'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { StatusCardData } from './pipeline-types';
import { AiInsightCard } from './AiInsightCard';
import styles from './StatusCard.module.css';

const PILL_CLASS: Record<string, string> = {
  live: styles.pillLive,
  onb: styles.pillOnb,
  review: styles.pillReview,
  stuck: styles.pillStuck,
  paused: styles.pillPaused,
  info: styles.pillInfo,
};

const DUE_CLASS: Record<string, string> = {
  bad: styles.dueBad,
  warn: styles.dueWarn,
  calm: styles.dueCalm,
  green: styles.dueGreen,
};

const STAT_BAR_TONE: Record<string, string> = {
  ok: styles.barOk,
  warn: styles.barWarn,
  bad: styles.barBad,
};

export function StatusCard({ card }: { card: StatusCardData }) {
  return (
    <Link href={card.href} className={styles.card}>
      <div
        className={styles.photo}
        style={
          card.coverUrl
            ? { backgroundImage: `url(${card.coverUrl})` }
            : { background: card.coverGradient ?? '#1a3548' }
        }
      >
        <div className={styles.photoOverlay} aria-hidden />
        {card.coverEmoji ? (
          <span className={styles.coverEmoji} aria-hidden>{card.coverEmoji}</span>
        ) : null}
        {card.statusPill ? (
          <span className={`${styles.statusPill} ${PILL_CLASS[card.statusPill.tone] ?? styles.pillInfo}`}>
            {card.statusPill.label}
          </span>
        ) : null}
        {card.stageBadge ? (
          <span className={styles.stageBadge}>{card.stageBadge}</span>
        ) : null}
      </div>
      <div className={styles.body}>
        <div className={styles.name}>{card.name}</div>
        {card.subline ? <div className={styles.sub}>{card.subline}</div> : null}
        {card.stats.length > 0 ? (
          <div className={styles.stats}>
            {card.stats.map((s, i) => (
              <div key={i} className={styles.stat}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statValue}>{s.value}</div>
                {typeof s.fillPct === 'number' ? (
                  <div className={styles.bar}>
                    <div
                      className={`${styles.barFill} ${STAT_BAR_TONE[s.tone ?? 'ok'] ?? styles.barOk}`}
                      style={{ width: `${Math.max(0, Math.min(100, s.fillPct))}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {card.insight ? <AiInsightCard insight={card.insight} /> : null}
        <footer className={styles.foot}>
          <div className={styles.avStack}>
            {card.assigneeAvatars.slice(0, 3).map((a, i) =>
              a.src ? (
                <Image
                  key={i}
                  src={a.src}
                  alt={a.label ?? ''}
                  width={24}
                  height={24}
                  className={styles.avatar}
                />
              ) : (
                <span key={i} className={styles.avatarFallback} aria-label={a.label}>
                  {a.initials}
                </span>
              ),
            )}
            {card.assigneeAvatars.length > 3 ? (
              <span className={styles.avatarMore}>+{card.assigneeAvatars.length - 3}</span>
            ) : null}
          </div>
          {card.dueTag ? (
            <span className={`${styles.due} ${DUE_CLASS[card.dueTag.tone] ?? styles.dueCalm}`}>
              {card.dueTag.label}
            </span>
          ) : null}
        </footer>
      </div>
    </Link>
  );
}
