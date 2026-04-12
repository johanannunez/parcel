import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  /* ── Auth check ── */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  /* ── Admin check ── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  /* ── Parse file from FormData ── */
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  /* Validate file type */
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, WebP, and SVG images are allowed" },
      { status: 400 },
    );
  }

  /* Max 10MB */
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
  }

  /* ── Upload to Supabase Storage ── */
  const service = createServiceClient();
  const ext = file.name.split(".").pop() ?? "png";
  const timestamp = Date.now();
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 60);
  const path = `articles/${timestamp}-${safeName}.${ext}`;

  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await service.storage
    .from("help-images")
    .upload(path, Buffer.from(bytes), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[help/upload] Storage error:", uploadError.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  /* ── Get public URL ── */
  const { data: urlData } = service.storage.from("help-images").getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
