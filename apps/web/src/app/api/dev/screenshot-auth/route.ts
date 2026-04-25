import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

/**
 * Dev-only endpoint: establishes an authenticated session for the admin
 * account without requiring a password, so Playwright can screenshot
 * protected routes.
 *
 * Flow:
 *   1. Service role generates a one-time OTP (no email sent).
 *   2. SSR client verifies the OTP and writes session cookies to the response.
 *   3. Redirects to /admin (or ?next= param).
 *
 * NEVER accessible in production — returns 404 when NODE_ENV !== 'development'.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const next = new URL(request.url).searchParams.get('next') ?? '/admin';

  // Step 1: generate OTP without sending an email
  const svc = createServiceClient();
  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email: 'jo@johanannunez.com',
  });

  if (linkError || !linkData.properties?.email_otp) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Failed to generate OTP' },
      { status: 500 },
    );
  }

  // Step 2: verify OTP with SSR client — this sets the session cookies
  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    email: 'jo@johanannunez.com',
    token: linkData.properties.email_otp,
    type: 'email',
  });

  if (otpError) {
    return NextResponse.json({ error: otpError.message }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}${next}`);
}
