'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { ColumnsList } from '@/components/admin/pipeline/ColumnsMenu';
import { buildContactStatusBoard } from '@/lib/admin/pipeline-adapters/contact-status';
import type { ContactRow, LifecycleStage } from '@/lib/admin/contact-types';
import type { Insight } from '@/lib/admin/ai-insights';
import { useContactsFilters, matchesAssigneeFilter } from './ContactsFiltersProvider';
import { useBoardTools } from './BoardToolsContext';
import { ContactsKanbanBoard } from './ContactsKanbanBoard';
import { updateContactStage } from '@/lib/admin/contact-actions';

type Props = {
  viewKey: string;
  rows: ContactRow[];
  insightsMap: Record<string, Insight[]>;
};

export function StatusBoardClient({ viewKey, rows, insightsMap }: Props) {
  const { sources, assignees } = useContactsFilters();
  const { setTools } = useBoardTools();
  const [stageOverrides, setStageOverrides] = useState<Record<string, LifecycleStage>>({});
  const [, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    if (sources.length === 0 && assignees.length === 0) return rows;
    return rows.filter((r) => {
      if (sources.length > 0 && (!r.source || !sources.includes(r.source))) {
        return false;
      }
      if (!matchesAssigneeFilter(assignees, r.assignedTo)) return false;
      return true;
    });
  }, [rows, sources, assignees]);

  const appliedRows = useMemo(
    () =>
      filteredRows.map((r) =>
        stageOverrides[r.id] ? { ...r, lifecycleStage: stageOverrides[r.id] } : r,
      ),
    [filteredRows, stageOverrides],
  );

  const columns = useMemo(
    () => buildContactStatusBoard(appliedRows, insightsMap, viewKey),
    [appliedRows, insightsMap, viewKey],
  );

  const boardKey = `contacts:${viewKey}`;
  const columnsForMenu = useMemo(
    () =>
      columns.map((c) => ({
        key: c.stage.key,
        label: c.stage.label,
        count: c.cards.length,
        defaultState: c.collapsed ? ('collapsed' as const) : ('shown' as const),
      })),
    [columns],
  );

  useEffect(() => {
    setTools(<ColumnsList boardKey={boardKey} columns={columnsForMenu} />);
    return () => setTools(null);
  }, [setTools, boardKey, columnsForMenu]);

  function handleCardMove(cardId: string, toStageKey: string) {
    const newStage = toStageKey as LifecycleStage;
    setStageOverrides((prev) => ({ ...prev, [cardId]: newStage }));

    startTransition(async () => {
      try {
        await updateContactStage(cardId, newStage);
      } catch (err) {
        console.error('Failed to update contact stage:', err);
        setStageOverrides((prev) => {
          const next = { ...prev };
          delete next[cardId];
          return next;
        });
      }
    });
  }

  const enableDrag = viewKey !== 'onboarding' && viewKey !== 'active-owners' && viewKey !== 'offboarding';

  return (
    <ContactsKanbanBoard
      columns={columns}
      boardKey={boardKey}
      enableDrag={enableDrag}
      onCardMove={handleCardMove}
    />
  );
}
