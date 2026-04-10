import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordSessionLogin } from "@/lib/session-log";

/**
 * Supabase Auth callback handler.
 *
 * This route is the target of `emailRedirectTo` when a new user
 * confirms their signup email, and of OAuth redirects if we add
 * social login later. The URL arrives with a `code` query param
 * which we exchange for a session before redirecting into the
 * authenticated area of the app.
 *
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Record session login
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
          ?? request.headers.get("x-real-ip")
          ?? null;
        const ua = request.headers.get("user-agent") ?? null;
        await recordSessionLogin({ userId: user.id, ipAddress: ip, userAgent: ua });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // On error, send the user back to login with a generic message.
  return NextResponse.redirect(
    `${origin}/login?error=Could not authenticate. Please try again.`,
  );
}
