import { createClient } from '@/lib/supabase/server';
import { StatusBoard } from '@/components/admin/pipeline/StatusBoard';
import { MetricsBar, type MetricTile } from '@/components/admin/pipeline/MetricsBar';
import { fetchInsightsByParent } from '@/lib/admin/ai-insights';
import {
  buildProjectStatusBoard,
  type ProjectStatusRow,
} from '@/lib/admin/pipeline-adapters/project-status';

async function fetchProjectStatusRows(): Promise<ProjectStatusRow[]> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status, type, color, emoji, assignee_name, due_date, created_at')
      .order('created_at', { ascending: false });
    // Gracefully return empty if the table doesn't exist yet (Plan C not merged).
    if (error) {
      if (error.code === '42P01') return []; // relation does not exist
      throw error;
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status ?? 'not_started',
      type: r.type ?? null,
      color: r.color ?? null,
      emoji: r.emoji ?? null,
      assigneeName: r.assignee_name ?? null,
      dueDate: r.due_date ?? null,
      createdAt: r.created_at,
    }));
  } catch {
    // Table doesn't exist — return empty so the board renders gracefully.
    return [];
  }
}

export async function ProjectsStatusView() {
  const rows = await fetchProjectStatusRows();
  const insightsMap = await fetchInsightsByParent('project', rows.map((r) => r.id));
  const columns = buildProjectStatusBoard(rows, insightsMap);

  const inProgress = rows.filter((r) => r.status === 'in_progress').length;
  const blocked = rows.filter((r) => r.status === 'blocked').length;
  const done = rows.filter((r) => r.status === 'done').length;

  const tiles: MetricTile[] = [
    { label: 'Total projects', value: String(rows.length), featured: true },
    { label: 'In progress', value: String(inProgress) },
    { label: 'Blocked', value: String(blocked), delta: blocked > 0 ? { text: 'needs attention', tone: 'warn' } : undefined },
    { label: 'Done', value: String(done) },
  ];

  return (
    <div>
      <MetricsBar tiles={tiles} />
      <StatusBoard columns={columns} emptyMessage="No projects yet. Plan C adds the projects table." />
    </div>
  );
}
