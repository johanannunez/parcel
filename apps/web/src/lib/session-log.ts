import { createServiceClient } from "@/lib/supabase/service";

/**
 * Parse a user agent string into browser, OS, and device type.
 */
function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: null, os: null, deviceType: null };

  // Browser detection
  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";

  // OS detection
  let os = "Unknown";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac OS X|macOS/.test(ua)) os = "macOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Linux/.test(ua)) os = "Linux";
  else if (/CrOS/.test(ua)) os = "Chrome OS";

  // Device type
  let deviceType = "Desktop";
  if (/iPhone|Android.*Mobile|iPod/.test(ua)) deviceType = "Mobile";
  else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) deviceType = "Tablet";

  return { browser, os, deviceType };
}

/**
 * Record a login event in the session_log table.
 * Call this from any login path (server action, auth callback, etc.).
 */
export async function recordSessionLogin(args: {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const svc = createServiceClient();
  const { browser, os, deviceType } = parseUserAgent(args.userAgent ?? null);

  await svc.from("session_log").insert({
    user_id: args.userId,
    ip_address: args.ipAddress ?? null,
    user_agent: args.userAgent ?? null,
    browser,
    os,
    device_type: deviceType,
  });
}
