import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { articleId?: string; helpful?: boolean; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { articleId, helpful, comment } = body;

  if (!articleId || typeof helpful !== "boolean") {
    return NextResponse.json(
      { error: "articleId (string) and helpful (boolean) are required" },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  // Insert feedback record
  const { error: feedbackError } = await service.from("help_feedback").insert({
    article_id: articleId,
    user_id: user.id,
    helpful,
    comment: comment?.trim() || null,
  });

  if (feedbackError) {
    console.error("[help/feedback] Insert error:", feedbackError.message);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  // Increment the appropriate counter on the article
  const column = helpful ? "helpful_count" : "not_helpful_count";

  const { data: article, error: fetchError } = await service
    .from("help_articles")
    .select(column)
    .eq("id", articleId)
    .single();

  if (fetchError || !article) {
    console.error("[help/feedback] Article fetch error:", fetchError?.message);
    return NextResponse.json({ success: true }); // Feedback saved, counter update is best-effort
  }

  const currentValue = (article as Record<string, number>)[column] ?? 0;

  const updatePayload = helpful
    ? { helpful_count: currentValue + 1 }
    : { not_helpful_count: currentValue + 1 };

  const { error: updateError } = await service
    .from("help_articles")
    .update(updatePayload)
    .eq("id", articleId);

  if (updateError) {
    console.error("[help/feedback] Counter update error:", updateError.message);
  }

  return NextResponse.json({ success: true });
}
