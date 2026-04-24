// apps/web/src/app/api/cron/communication-intelligence/route.ts
import { NextResponse } from 'next/server';
import { runCommunicationIntelligenceSync } from '@/lib/admin/communication-intelligence';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runCommunicationIntelligenceSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[communication-intelligence] sync error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
