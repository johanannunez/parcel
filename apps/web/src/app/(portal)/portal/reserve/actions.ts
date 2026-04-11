"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitBlockRequest(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };
  const propertyId = formData.get("property_id") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const note = formData.get("note") as string;
  if (!propertyId || !startDate || !endDate)
    return { ok: false, message: "Property and dates are required." };
  if (startDate > endDate)
    return { ok: false, message: "End date must be after start date." };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("block_requests").insert({
    property_id: propertyId,
    owner_id: user.id,
    start_date: startDate,
    end_date: endDate,
    note: note || null,
    status: "pending",
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/portal/reserve");
  return { ok: true };
}
