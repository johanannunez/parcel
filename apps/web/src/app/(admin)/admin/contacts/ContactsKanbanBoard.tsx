'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ContactStatusCard } from '@/components/admin/pipeline/ContactStatusCard';
import type { StatusCardData, StatusColumnData, ColumnState } from '@/components/admin/pipeline/pipeline-types';
import { useColumnStates } from '@/components/admin/pipeline/useColumnStates';
import columnStyles from '@/components/admin/pipeline/StatusColumn.module.css';
import styles from './ContactsKanbanBoard.module.css';

type Props = {
  columns: StatusColumnData[];
  boardKey: string;
  enableDrag: boolean;
  onCardMove: (cardId: string, toStageKey: string) => void;
};

export function ContactsKanbanBoard({ columns, boardKey, enableDrag, onCardMove }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const defaults = useMemo<Record<string, ColumnState>>(() => {
    const m: Record<string, ColumnState> = {};
    for (const c of columns) {
      m[c.stage.key] = c.collapsed ? 'collapsed' : 'shown';
    }
    return m;
  }, [columns]);

  const { stateOf, setState } = useColumnStates(boardKey, defaults);
  const [activeCard, setActiveCard] = useState<StatusCardData | null>(null);

  function onDragStart(e: DragStartEvent) {
    if (!enableDrag) return;
    const id = String(e.active.id);
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === id);
      if (found) { setActiveCard(found); return; }
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    if (!enableDrag) return;
    const cardId = String(e.active.id);
    const fromStageKey = e.active.data.current?.stageKey as string | undefined;
    const toStageKey = e.over ? String(e.over.id) : null;
    if (!toStageKey || toStageKey === fromStageKey) return;
    onCardMove(cardId, toStageKey);
  }

  return (
    <DndContext
      sensors={enableDrag ? sensors : []}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className={styles.board}>
        {columns.map((col) => {
          const state = stateOf(col.stage.key);
          if (state === 'hidden') return null;
          if (state === 'collapsed') {
            return (
              <div key={col.stage.key} className={styles.colCollapsed}>
                <CollapsedRail
                  col={col}
                  onExpand={() => setState(col.stage.key, 'shown')}
                />
              </div>
            );
          }
          const bodyBg = BODY_BG[col.stage.color] ?? BODY_BG.gray;
          const borderC = BORDER_C[col.stage.color] ?? BORDER_C.gray;
          return (
            <div
              key={col.stage.key}
              className={styles.col}
              style={{ background: bodyBg, border: `1px solid ${borderC}` }}
            >
              <ColumnBody
                col={col}
                enableDrag={enableDrag}
                onCollapse={() => setState(col.stage.key, 'collapsed')}
                draggingId={activeCard?.id ?? null}
              />
            </div>
          );
        })}
      </div>
      {enableDrag ? (
        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className={styles.overlay}>
              <ContactStatusCard card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      ) : null}
    </DndContext>
  );
}

// ── Column palette (mirrors StatusColumn) ──────────────────────────────────

const HEAD_BG: Record<string, string> = {
  blue:   'linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)',
  violet: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  green:  'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  amber:  'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  red:    'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
  gray:   'linear-gradient(135deg, #64748B 0%, #334155 100%)',
};

const BODY_BG: Record<string, string> = {
  blue:   'rgba(2, 170, 235, 0.05)',
  violet: 'rgba(139, 92, 246, 0.05)',
  green:  'rgba(16, 185, 129, 0.05)',
  amber:  'rgba(245, 158, 11, 0.06)',
  red:    'rgba(239, 68, 68, 0.05)',
  gray:   'rgba(100, 116, 139, 0.06)',
};

const BORDER_C: Record<string, string> = {
  blue:   'rgba(2, 170, 235, 0.22)',
  violet: 'rgba(139, 92, 246, 0.22)',
  green:  'rgba(16, 185, 129, 0.22)',
  amber:  'rgba(245, 158, 11, 0.28)',
  red:    'rgba(239, 68, 68, 0.26)',
  gray:   'rgba(100, 116, 139, 0.20)',
};

// ── Collapsed rail ─────────────────────────────────────────────────────────

function CollapsedRail({ col, onExpand }: { col: StatusColumnData; onExpand: () => void }) {
  const bg = HEAD_BG[col.stage.color] ?? HEAD_BG.gray;
  return (
    <button
      type="button"
      className={columnStyles.rail}
      style={{ background: bg }}
      onClick={onExpand}
      aria-label={`Expand ${col.stage.label}`}
      title={`Expand ${col.stage.label}`}
    >
      <span className={columnStyles.railCount}>{col.cards.length}</span>
      <span className={columnStyles.railLabel}>{col.stage.label}</span>
    </button>
  );
}

// ── Full column with optional drop zone ────────────────────────────────────

function ColumnBody({
  col,
  enableDrag,
  onCollapse,
  draggingId,
}: {
  col: StatusColumnData;
  enableDrag: boolean;
  onCollapse: () => void;
  draggingId: string | null;
}) {
  const bg = HEAD_BG[col.stage.color] ?? HEAD_BG.gray;
  const { setNodeRef, isOver } = useDroppable({ id: col.stage.key });

  return (
    <div ref={enableDrag ? setNodeRef : undefined} className={columnStyles.col} style={{ gap: 0 }}>
      <header className={columnStyles.head} style={{ background: bg, borderRadius: '8px 8px 0 0', padding: '10px 14px 12px' }}>
        <div className={columnStyles.topRow}>
          <span className={columnStyles.name} style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.1 }}>{col.stage.label}</span>
          <span className={columnStyles.headActions}>
            <span className={columnStyles.count}>{col.cards.length}</span>
            <button
              type="button"
              className={columnStyles.collapseBtn}
              onClick={onCollapse}
              aria-label={`Collapse ${col.stage.label}`}
              title="Collapse column"
            >
              ›
            </button>
          </span>
        </div>
        {col.stage.totalLabel ? (
          <div className={columnStyles.total}>{col.stage.totalLabel}</div>
        ) : null}
        {col.stage.sublabel ? (
          <div className={columnStyles.sub}>{col.stage.sublabel}</div>
        ) : null}
      </header>

      <div
        className={`${styles.cards}${isOver && enableDrag ? ` ${styles.cardsOver}` : ''}`}
      >
        {col.cards.map((card) =>
          enableDrag ? (
            <DraggableCard
              key={card.id}
              card={card}
              stageKey={col.stage.key}
              isDraggingThis={draggingId === card.id}
            />
          ) : (
            <ContactStatusCard key={card.id} card={card} />
          ),
        )}
      </div>
    </div>
  );
}

// ── Draggable card wrapper ─────────────────────────────────────────────────

function DraggableCard({
  card,
  stageKey,
  isDraggingThis,
}: {
  card: StatusCardData;
  stageKey: string;
  isDraggingThis: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
    data: { stageKey },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.cardWrap}${isDraggingThis ? ` ${styles.draggingPlaceholder}` : ''}`}
      {...listeners}
      {...attributes}
    >
      <ContactStatusCard card={card} />
    </div>
  );
}
