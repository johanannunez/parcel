import { NextRequest, NextResponse } from "next/server";

/**
 * Notion → Paperclip webhook relay.
 *
 * Notion Database Automations POST here when a content card's Status changes.
 * This route maps the new status to one or more Paperclip routine IDs and
 * triggers each one via POST /api/routines/{id}/trigger.
 *
 * Security: requests must include the NOTION_WEBHOOK_SECRET either as a
 * query param (?secret=...) or in the x-webhook-secret header.
 */

const PAPERCLIP_BASE = "http://srv1536024.hstgr.cloud:44387";

// Brand Account routine IDs (from /BA/routines/{id} URLs in Paperclip dashboard)
const ROUTINES = {
  contentStrategy: "7e641e20-bfd4-4378-a912-7ce52d09a55d",
  writeCopy: "20004e105-67af-4a13-bed6-9aa52e3977eb",
  checkInterviews: "4a18c8bb-6d26-45cd-a7d7-c7f8019987cf",
  createVisuals: "1a0162be-7566-407a-95ca-74701d0be9f3",
  buildNewsletter: "cd9b5e41-32c2-4a8d-a336-2dcb1557844a",
  qualityGate: "97def236-88d1-43fe-a12a-6737be4bf947",
  schedulePublish: "dbb337e8-9f61-4784-b27f-590fb9b6ed3",
} as const;

// Notion status value → routines to trigger
const STATUS_MAP: Record<string, string[]> = {
  Strategy: [ROUTINES.contentStrategy],
  "Copy Writing": [ROUTINES.writeCopy, ROUTINES.checkInterviews],
  Visuals: [ROUTINES.createVisuals, ROUTINES.buildNewsletter],
  "Copy Review": [ROUTINES.qualityGate],
  "Visuals Review": [ROUTINES.qualityGate],
  "Ready to Schedule": [ROUTINES.schedulePublish],
};

async function triggerRoutine(routineId: string): Promise<void> {
  const res = await fetch(`${PAPERCLIP_BASE}/api/routines/${routineId}/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Routine ${routineId} returned ${res.status}: ${body}`);
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
  // Status can be a select or status property type
  const properties = (body as Record<string, unknown> | null)?.data as
    | Record<string, unknown>
    | undefined;

  const statusProp = (properties?.properties as Record<string, unknown> | undefined)?.Status as
    | Record<string, unknown>
    | undefined;

  const status: string | null =
    (statusProp?.select as { name?: string } | undefined)?.name ??
    (statusProp?.status as { name?: string } | undefined)?.name ??
    null;

  if (!status) {
    return NextResponse.json({ ok: true, skipped: "no_status_change" });
  }

  const routineIds = STATUS_MAP[status];
  if (!routineIds?.length) {
    return NextResponse.json({ ok: true, skipped: "untracked_status", status });
  }

  const results = await Promise.allSettled(routineIds.map(triggerRoutine));
  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

  if (failures.length > 0) {
    const messages = failures.map((f) => (f.reason as Error).message);
    console.error("[Notion webhook] routine trigger failures:", messages);
    return NextResponse.json(
      {
        ok: false,
        triggered: routineIds.length - failures.length,
        failed: failures.length,
        errors: messages,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, triggered: routineIds.length, status });
}
