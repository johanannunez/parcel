// apps/web/src/app/api/webhooks/quo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { resolvePhone } from '@/lib/admin/resolve-phone';
import { normalizePhone } from '@/lib/admin/normalize-phone';

export const dynamic = 'force-dynamic';

const HANDLED_EVENTS = new Set([
  'call.transcript.completed',
  'call.recording.completed',
  'call.summary.completed',
  'message.received',
  'message.delivered',
]);

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.QUO_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    const sig = req.headers.get('x-openphone-signature') ?? '';
    if (!verifySignature(rawBody, sig, secret)) {
      console.warn('[quo-webhook] invalid signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = payload.type as string | undefined;
  const data = payload.data as Record<string, unknown> | undefined;

  if (!event || !data || !HANDLED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, skipped: event ?? 'missing event' });
  }

  const quoId = (data.id ?? data.callId ?? data.messageId) as string | undefined;
  if (!quoId) {
    return NextResponse.json({ ok: true, skipped: 'no id' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // call.recording.completed and call.summary.completed update an existing row.
  if (event === 'call.recording.completed') {
    const recordingUrl = (data.recordingUrl ?? data.url) as string | undefined;
    if (recordingUrl) {
      await supabase
        .from('communication_events')
        .update({ recording_url: recordingUrl })
        .eq('quo_id', quoId);
    }
    return NextResponse.json({ ok: true });
  }

  if (event === 'call.summary.completed') {
    const summary = (data.summary ?? data.text) as string | undefined;
    if (summary) {
      await supabase
        .from('communication_events')
        .update({ quo_summary: summary })
        .eq('quo_id', quoId);
    }
    return NextResponse.json({ ok: true });
  }

  // Insert path: call.transcript.completed, message.received, message.delivered
  const phoneFrom = normalizePhone((data.from as string | undefined) ?? '');
  const phoneTo = normalizePhone((data.to as string | undefined) ?? '');

  if (!phoneFrom) {
    return NextResponse.json({ ok: true, skipped: 'no phone_from' });
  }

  const isInbound = event !== 'message.delivered';
  const channel: 'call' | 'sms' = event === 'call.transcript.completed' ? 'call' : 'sms';
  const direction: 'inbound' | 'outbound' = isInbound ? 'inbound' : 'outbound';

  const rawTranscript =
    channel === 'call'
      ? ((data.transcript as string | undefined) ?? null)
      : ((data.body ?? data.text) as string | undefined) ?? null;

  const durationSeconds =
    channel === 'call' ? ((data.duration as number | undefined) ?? null) : null;

  const resolved = isInbound ? await resolvePhone(phoneFrom) : null;

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (!adminProfile) {
    console.error('[quo-webhook] no admin profile found');
    return NextResponse.json({ ok: true, skipped: 'no admin profile' });
  }

  const processAfter = isInbound
    ? new Date(Date.now() + 25 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('communication_events').upsert(
    {
      profile_id: adminProfile.id,
      quo_id: quoId,
      channel,
      direction,
      phone_from: phoneFrom,
      phone_to: phoneTo,
      raw_transcript: rawTranscript,
      duration_seconds: durationSeconds,
      entity_type: resolved?.type ?? null,
      entity_id: resolved && resolved.type !== 'unknown' ? resolved.entityId : null,
      process_after: processAfter,
    },
    { onConflict: 'quo_id', ignoreDuplicates: true }
  );

  if (error) {
    console.error('[quo-webhook] insert error:', (error as { code?: string; message?: string }).code, (error as { code?: string; message?: string }).message);
  }

  return NextResponse.json({ ok: true });
}
