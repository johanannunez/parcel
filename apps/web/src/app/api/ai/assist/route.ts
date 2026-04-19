import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Mode = 'correct' | 'rephrase' | 'complete' | 'custom';

const SYSTEM_PROMPTS: Record<Exclude<Mode, 'custom'>, string> = {
  correct:
    'Fix grammar, spelling, and punctuation in the user\'s text. Keep their voice and meaning. Reply with the corrected text only, no preamble.',
  rephrase:
    'Rewrite the user\'s text to be clearer and more concise. Keep the facts and intent. Reply with the rewritten text only, no preamble.',
  complete:
    'Continue writing where the user left off. Keep the same tone and style. Reply with the continuation ONLY (not the original), no preamble.',
};

const MAX_TEXT_CHARS = 10_000;
const MAX_INSTRUCTION_CHARS = 500;

// Simple in-memory sliding-window rate limiter keyed by user id.
// 20 requests / 60 seconds per user. Fine for a single-region
// Fluid Compute instance; replace with a shared store if we scale out.
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const rateHits = new Map<string, number[]>();

function rateLimitCheck(userId: string): { allowed: boolean; retryInSec: number } {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const prior = rateHits.get(userId) ?? [];
  const recent = prior.filter((t) => t > windowStart);
  if (recent.length >= RATE_LIMIT) {
    const oldest = recent[0];
    const retryInSec = Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000));
    rateHits.set(userId, recent);
    return { allowed: false, retryInSec };
  }
  recent.push(now);
  rateHits.set(userId, recent);
  return { allowed: true, retryInSec: 0 };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const rate = rateLimitCheck(user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: 'rate limit exceeded',
        retry_in_seconds: rate.retryInSec,
      },
      { status: 429, headers: { 'Retry-After': String(rate.retryInSec) } },
    );
  }

  let body: { mode: Mode; text: string; instruction?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { mode, text, instruction } = body;
  if (!mode || !text) {
    return NextResponse.json({ error: 'mode and text are required' }, { status: 400 });
  }

  if (typeof text !== 'string' || text.length > MAX_TEXT_CHARS) {
    return NextResponse.json(
      { error: `text must be a string under ${MAX_TEXT_CHARS} characters` },
      { status: 400 },
    );
  }
  if (instruction !== undefined) {
    if (typeof instruction !== 'string' || instruction.length > MAX_INSTRUCTION_CHARS) {
      return NextResponse.json(
        { error: `instruction must be a string under ${MAX_INSTRUCTION_CHARS} characters` },
        { status: 400 },
      );
    }
  }

  const systemPrompt =
    mode === 'custom'
      ? (instruction ?? 'Follow the user\'s instructions.')
      : SYSTEM_PROMPTS[mode];

  const client = new Anthropic();
  const resp = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: text }],
  });

  const output = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  return NextResponse.json({ output });
}
