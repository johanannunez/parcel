import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const adminProfileId = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000";

  if (!code || !adminProfileId) {
    return NextResponse.redirect(`${appUrl}/admin?error=calendar_auth_failed`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/admin?error=calendar_auth_failed`);
  }

  const redirectUri = `${appUrl}/api/auth/google-calendar/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/admin?error=calendar_auth_failed`);
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
    };

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = userInfoRes.ok
      ? ((await userInfoRes.json()) as { email?: string })
      : {};

    const expiresAt = Date.now() + tokens.expires_in * 1000;

    const supabase = await createClient();
    await supabase.from("connections").upsert(
      {
        owner_id: adminProfileId,
        provider: "google_calendar",
        external_account_id: userInfo.email ?? null,
        status: "connected",
        metadata: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: expiresAt,
          calendar_email: userInfo.email ?? null,
        },
        connected_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,provider" },
    );

    return NextResponse.redirect(`${appUrl}/admin/entities?calendar_connected=1`);
  } catch {
    return NextResponse.redirect(`${appUrl}/admin?error=calendar_auth_failed`);
  }
}
