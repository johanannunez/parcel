import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Cron worker: marks tasks as pre-notification-sent when they enter their
 * pre-notify window (now >= due_at - pre_notify_hours).
 *
 * Triggered by Vercel Cron every 15 minutes. Schedule lives in apps/web/vercel.json.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 * Set CRON_SECRET in Vercel env vars (Doppler) before deploying.
 *
 * Actual notification delivery (email, in-app) is out of scope here.
 * This worker flips `metadata.pre_notify_sent = true` so a downstream
 * notification service or future realtime listener can pick it up.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = createServiceClient();
  const now = new Date();

  // Paginate to avoid Supabase's 1000-row default limit silently dropping rows.
  // Keep total runtime well under the 60s Vercel cron function timeout — if the
  // queue grows too large, log a warning and stop processing early.
  const PAGE_SIZE = 500;
  const MAX_PAGES = 20; // 10,000 rows max per cron run
  const SOFT_DEADLINE_MS = 50_000;
  const startedAt = Date.now();

  let notified = 0;
  let checked = 0;
  let page = 0;
  let offset = 0;
  let truncated = false;

  while (page < MAX_PAGES) {
    if (Date.now() - startedAt > SOFT_DEADLINE_MS) {
      console.warn(
        `[Cron/tasks-notify] Soft deadline reached after ${page} page(s). Stopping early.`,
      );
      truncated = true;
      break;
    }

    const { data: batch, error: fetchError } = await svc
      .from('tasks')
      .select('id, title, due_at, pre_notify_hours, assignee_id, parent_type, parent_id, metadata')
      .neq('status', 'done')
      .not('pre_notify_hours', 'is', null)
      .not('due_at', 'is', null)
      .order('due_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (fetchError) {
      console.error('[Cron/tasks-notify] Failed to fetch tasks:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const rows = batch ?? [];
    checked += rows.length;

    for (const t of rows) {
      const due = new Date(t.due_at as string);
      const windowStart = new Date(due.getTime() - (t.pre_notify_hours as number) * 3_600_000);

      // Skip if we haven't reached the notify window yet
      if (now < windowStart) continue;
      // Skip if the task is already past due (missed window)
      if (now > due) continue;
      // Skip if already flagged
      const meta = (t.metadata ?? {}) as Record<string, unknown>;
      if (meta.pre_notify_sent === true) continue;

      const { error: updateError } = await svc
        .from('tasks')
        .update({
          metadata: {
            ...meta,
            pre_notify_sent: true,
            pre_notify_sent_at: now.toISOString(),
          },
        })
        .eq('id', t.id);

      if (updateError) {
        console.error(`[Cron/tasks-notify] Failed to flag task ${t.id}:`, updateError);
        continue;
      }

      notified++;
    }

    // Last page when we got back fewer than the full batch size.
    if (rows.length < PAGE_SIZE) break;

    offset += PAGE_SIZE;
    page++;
  }

  if (page >= MAX_PAGES) {
    console.warn(
      `[Cron/tasks-notify] Hit MAX_PAGES=${MAX_PAGES}. Queue may be larger than this run can process; consider increasing cadence.`,
    );
    truncated = true;
  }

  console.log(
    `[Cron/tasks-notify] Checked ${checked} tasks, notified ${notified}${truncated ? ' (truncated)' : ''}.`,
  );

  return NextResponse.json({
    ok: true,
    checked,
    preNotified: notified,
    truncated,
    timestamp: now.toISOString(),
  });
}
