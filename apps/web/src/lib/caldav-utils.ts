import { format } from 'date-fns';

// CalDAV PRIORITY uses 1-9 scale. 1=highest priority.
const PRIORITY_MAP: Record<number, number> = { 1: 1, 2: 3, 3: 5, 4: 9 };

export interface CalDAVTask {
  id: string;
  caldavUid: string;
  title: string;
  dueAt: string | null;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 1 | 2 | 3 | 4;
  updatedAt: string;
}

export function taskToVTodo(task: CalDAVTask, baseUrl: string): string {
  const uid = task.caldavUid;
  const dtStamp = formatIcalDate(new Date());
  const lastMod = formatIcalDate(new Date(task.updatedAt));
  const icalStatus = task.status === 'done' ? 'COMPLETED' : 'NEEDS-ACTION';
  const priority = PRIORITY_MAP[task.priority] ?? 9;
  const taskUrl = `${baseUrl}/admin/tasks`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parcel//TaskOS//EN',
    'BEGIN:VTODO',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `LAST-MODIFIED:${lastMod}`,
    `SUMMARY:${escapeIcal(task.title)}`,
    `STATUS:${icalStatus}`,
    `PRIORITY:${priority}`,
    `DESCRIPTION:${taskUrl}`,
  ];

  if (task.dueAt) {
    lines.push(`DUE:${formatIcalDate(new Date(task.dueAt))}`);
  }

  if (task.status === 'done') {
    lines.push(`COMPLETED:${lastMod}`);
  }

  lines.push('END:VTODO', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function generateETag(updatedAt: string): string {
  return `"${new Date(updatedAt).getTime()}"`;
}

export function parseVTodoStatus(body: string): 'COMPLETED' | 'NEEDS-ACTION' | null {
  const match = body.match(/^STATUS:(.+)$/m);
  if (!match) return null;
  const val = match[1].trim();
  if (val === 'COMPLETED' || val === 'NEEDS-ACTION') return val;
  return null;
}

export function parseVTodoUid(body: string): string | null {
  const match = body.match(/^UID:(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function formatIcalDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
