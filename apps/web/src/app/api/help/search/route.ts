import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "10", 10) || 10, 1), 50);

  if (!q) {
    return NextResponse.json([]);
  }

  const service = createServiceClient();

  const { data: results, error } = await service.rpc("search_help_articles", {
    search_query: q,
    max_results: limit,
  });

  if (error) {
    console.error("[help/search] RPC error:", error.message);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  // Log the search asynchronously (best effort, don't block response)
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Anonymous user
  }

  service
    .from("help_search_logs")
    .insert({
      query: q,
      results_count: results?.length ?? 0,
      user_id: userId,
    })
    .then(({ error: logError }) => {
      if (logError) {
        console.error("[help/search] Failed to log search:", logError.message);
      }
    });

  return NextResponse.json(results ?? []);
}
