import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient as _createServiceClient } from "@/lib/supabase/service";
import { treasuryAdminGuard } from "@/lib/treasury/admin-guard";

// Treasury tables not yet in generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createServiceClient = () => _createServiceClient() as any;

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await treasuryAdminGuard();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing alert id" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { error } = await svc
    .from("treasury_alerts")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", id)
    .is("acknowledged_at", null);

  if (error) {
    console.error("[Treasury Alerts] Acknowledge error:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
