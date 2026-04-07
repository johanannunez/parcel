import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // On error, send the user back to login with a generic message.
  return NextResponse.redirect(
    `${origin}/login?error=Could not authenticate. Please try again.`,
  );
}
