/**
 * One-shot test endpoint for Web Push verification.
 *
 * Visit this URL while logged in as an admin to trigger a push
 * notification to ALL of your subscribed devices. Used to verify
 * the PWA push notification pipeline end-to-end without needing
 * another user account.
 *
 * Delete this file after the test is complete.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToOwner } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  // Check if user has any push subscriptions
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, device_info")
    .eq("user_id", user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "No push subscriptions found for this user. Open /portal/messages on the device you want to test, tap 'Enable notifications', and grant permission first.",
    });
  }

  try {
    await sendPushToOwner({
      ownerId: user.id,
      title: "Parcel push test",
      body: "If you see this on your lock screen, Web Push is fully working. Tap to open the portal.",
      url: "/portal/messages",
      tag: "push-test",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[test-push-self] Failed to send push:", err);
    return NextResponse.json(
      { ok: false, error: message, stack },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Push sent",
    targetedDevices: subs.length,
    devices: subs.map((s) => s.device_info ?? "Unknown device"),
  });
}
