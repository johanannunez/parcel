import { NextResponse } from "next/server";
import { fetchChangelogs } from "@/lib/admin/changelogs";

export async function GET() {
  const entries = await fetchChangelogs(20);
  return NextResponse.json(entries);
}
