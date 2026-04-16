import { NextRequest, NextResponse } from "next/server";

/**
 * Notion → Paperclip webhook relay.
 *
 * Notion Database Automations POST here when a content card's Status changes.
 * This route authenticates with Paperclip, then invokes the heartbeat for
 * each agent responsible for handling that pipeline stage.
 *
 * Security: requests must include NOTION_WEBHOOK_SECRET as a query param
 * (?secret=...) or in the x-webhook-secret header.
 */

const PAPERCLIP_BASE = "https://paperclip-9qhd.srv1536024.hstgr.cloud";
const COMPANY_ID = "73cd2007-5fa9-4894-b66e-31cf0a0fa0f9";

// Notion status value → agent shortnames to wake up
const STATUS_MAP: Record<string, string[]> = {
  Strategy: ["content-strategist"],
  "Copy Writing": ["copywriter", "interviewer"],
  Visuals: ["visual-creator", "newsletter-designer"],
  "Copy Review": ["creative-director"],
  "Visuals Review": ["creative-director"],
  "Ready to Schedule": ["content-strategist"],
};

async function getPaperclipSession(): Promise<string> {
  const email = process.env.PAPERCLIP_EMAIL;
  const password = process.env.PAPERCLIP_PASSWORD;

  if (!email || !password) {
    throw new Error("PAPERCLIP_EMAIL or PAPERCLIP_PASSWORD not configured");
  }

  const res = await fetch(`${PAPERCLIP_BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: PAPERCLIP_BASE,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Paperclip login failed (${res.status}): ${body}`);
  }

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("Paperclip login succeeded but no session cookie returned");
  }

  // Extract just the cookie name=value pairs (strip attributes like Path, HttpOnly, etc.)
  const cookies = setCookie
    .split(/,(?=[^ ]+ *=)/)
    .map((c) => c.split(";")[0].trim())
    .join("; ");

  return cookies;
}

async function invokeHeartbeat(agentShortname: string, sessionCookie: string): Promise<void> {
  const url = `${PAPERCLIP_BASE}/api/agents/${agentShortname}/heartbeat/invoke?companyId=${COMPANY_ID}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
      Origin: PAPERCLIP_BASE,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Agent ${agentShortname} heartbeat returned ${res.status}: ${body}`);
  }
}

export async function POST(req: NextRequest) {
  const secret =
    req.headers.get("x-webhook-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (!process.env.NOTION_WEBHOOK_SECRET || secret !== process.env.NOTION_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Notion sends the new property values under data.properties
  const data = (body as Record<string, unknown> | null)?.data as
    | Record<string, unknown>
    | undefined;

  const statusProp = (data?.properties as Record<string, unknown> | undefined)?.Status as
    | Record<string, unknown>
    | undefined;

  const status: string | null =
    (statusProp?.select as { name?: string } | undefined)?.name ??
    (statusProp?.status as { name?: string } | undefined)?.name ??
    null;

  if (!status) {
    return NextResponse.json({ ok: true, skipped: "no_status_change" });
  }

  const agents = STATUS_MAP[status];
  if (!agents?.length) {
    return NextResponse.json({ ok: true, skipped: "untracked_status", status });
  }

  let sessionCookie: string;
  try {
    sessionCookie = await getPaperclipSession();
  } catch (err) {
    const message = (err as Error).message;
    console.error("[Notion webhook] Paperclip login failed:", message);
    return NextResponse.json({ ok: false, error: "paperclip_auth_failed", detail: message }, { status: 502 });
  }

  const results = await Promise.allSettled(
    agents.map((agent) => invokeHeartbeat(agent, sessionCookie)),
  );
  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

  if (failures.length > 0) {
    const messages = failures.map((f) => (f.reason as Error).message);
    console.error("[Notion webhook] heartbeat failures:", messages);
    return NextResponse.json(
      {
        ok: false,
        triggered: agents.length - failures.length,
        failed: failures.length,
        errors: messages,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, triggered: agents.length, status });
}
