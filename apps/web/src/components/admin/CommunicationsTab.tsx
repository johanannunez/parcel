// apps/web/src/components/admin/CommunicationsTab.tsx
'use client';
import { useState } from 'react';
import { PhoneCall, ChatText, CaretDown, CaretUp, Lightning, Play } from '@phosphor-icons/react';
import type { CommunicationEvent } from '@/lib/admin/communication-types';
import styles from './CommunicationsTab.module.css';

type Props = {
  events: CommunicationEvent[];
  latestSummary: string | null;
  actionItems: string[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function EventRow({ event }: { event: CommunicationEvent }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = Boolean(event.rawTranscript);
  const Icon = event.channel === 'call' ? PhoneCall : ChatText;

  return (
    <div className={styles.eventRow}>
      <div className={styles.eventHeader} onClick={() => hasContent && setExpanded((v) => !v)}>
        <div className={styles.eventMeta}>
          <Icon size={16} weight="duotone" className={styles.channelIcon} />
          <span className={styles.eventLabel}>
            {event.channel === 'call' ? 'Call' : 'SMS'}{' '}
            {event.direction === 'inbound' ? 'received' : 'sent'}
            {event.durationSeconds ? ` (${formatDuration(event.durationSeconds)})` : ''}
          </span>
          <span className={styles.eventDate}>{formatDate(event.createdAt)}</span>
          {event.recordingUrl && (
            <a
              href={event.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.playBtn}
              onClick={(e) => e.stopPropagation()}
              aria-label="Play recording"
            >
              <Play size={12} weight="fill" /> Recording
            </a>
          )}
        </div>
        {hasContent && (
          <button className={styles.expandBtn} aria-label="Toggle transcript">
            {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>
        )}
      </div>
      {expanded && event.rawTranscript && (
        <div className={styles.transcript}>{event.rawTranscript}</div>
      )}
    </div>
  );
}

export function CommunicationsTab({ events, latestSummary, actionItems }: Props) {
  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        <ChatText size={32} weight="duotone" />
        <p>No communications yet.</p>
        <p className={styles.emptyHint}>Calls and texts from this contact will appear here after they come in through Quo.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {latestSummary && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <Lightning size={16} weight="fill" />
            Latest summary
          </div>
          <p className={styles.summaryBody}>{latestSummary}</p>
          {actionItems.length > 0 && (
            <ul className={styles.actionItems}>
              {actionItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className={styles.eventList}>
        {events.map((ev) => (
          <EventRow key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  );
}
