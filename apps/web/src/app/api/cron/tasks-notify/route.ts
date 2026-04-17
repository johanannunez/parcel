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

  // Fetch all open tasks that have both a due date and a pre-notify window set.
  const { data: candidates, error: fetchError } = await svc
    .from('tasks')
    .select('id, title, due_at, pre_notify_hours, assignee_id, parent_type, parent_id, metadata')
    .neq('status', 'done')
    .not('pre_notify_hours', 'is', null)
    .not('due_at', 'is', null);

  if (fetchError) {
    console.error('[Cron/tasks-notify] Failed to fetch tasks:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let notified = 0;

  for (const t of candidates ?? []) {
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

  console.log(`[Cron/tasks-notify] Checked ${(candidates ?? []).length} tasks, notified ${notified}.`);

  return NextResponse.json({
    ok: true,
    checked: (candidates ?? []).length,
    preNotified: notified,
    timestamp: now.toISOString(),
  });
}
