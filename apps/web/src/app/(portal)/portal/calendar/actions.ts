"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function notifyAdminOfBlockRequest(args: {
  ownerEmail: string;
  ownerName: string | null;
  propertyLabel: string;
  startDate: string;
  endDate: string;
  note: string | null;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  const to = process.env.INQUIRY_TO_EMAIL ?? "hello@theparcelco.com";
  const range =
    args.startDate === args.endDate
      ? args.startDate
      : `${args.startDate} → ${args.endDate}`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Parcel <hello@theparcelco.com>",
        to,
        subject: `New block request: ${args.propertyLabel} (${range})`,
        text: [
          `A new block request was submitted in the owner portal.`,
          ``,
          `Owner: ${args.ownerName ?? args.ownerEmail} (${args.ownerEmail})`,
          `Property: ${args.propertyLabel}`,
          `Dates: ${range}`,
          args.note ? `\nReason:\n${args.note}` : null,
          ``,
          `Review and approve: https://www.theparcelco.com/admin/block-requests`,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });
  } catch (err) {
    console.error("[BlockRequest] email failed:", err);
  }
}

const Schema = z
  .object({
    propertyId: z.string().uuid(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    reason: z.string().max(120).optional(),
    adults: z.number().int().min(0).max(30).optional(),
    children: z.number().int().min(0).max(20).optional(),
    pets: z.number().int().min(0).max(10).optional(),
    notes: z.string().max(500).optional(),
    isOwnerStaying: z.boolean().optional(),
    guestName: z.string().max(200).optional(),
    guestEmail: z.string().max(200).optional(),
    guestPhone: z.string().max(40).optional(),
    needsLockCode: z.boolean().optional(),
    requestedLockCode: z.string().max(20).optional(),
    wantsCleaning: z.boolean().optional(),
    cleaningFee: z.number().min(0).optional(),
    damageAcknowledged: z.boolean().optional(),
    note: z.string().max(500).optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export type BlockRequestResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitBlockRequest(
  input: unknown,
): Promise<BlockRequestResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Please check the dates and try again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("block_requests").insert({
    owner_id: user.id,
    property_id: parsed.data.propertyId,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    note: parsed.data.notes ?? parsed.data.note ?? null,
    status: "pending",
    check_in_time: parsed.data.checkInTime ?? null,
    check_out_time: parsed.data.checkOutTime ?? null,
    reason: parsed.data.reason ?? null,
    is_owner_staying: parsed.data.isOwnerStaying ?? true,
    guest_name: parsed.data.guestName ?? null,
    guest_email: parsed.data.guestEmail ?? null,
    guest_phone: parsed.data.guestPhone ?? null,
    adults: parsed.data.adults ?? 1,
    children: parsed.data.children ?? 0,
    pets: parsed.data.pets ?? 0,
    needs_lock_code: parsed.data.needsLockCode ?? false,
    requested_lock_code: parsed.data.requestedLockCode ?? null,
    wants_cleaning: parsed.data.wantsCleaning ?? false,
    cleaning_fee: parsed.data.cleaningFee ?? null,
    damage_acknowledged: parsed.data.damageAcknowledged ?? false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const [{ data: profile }, { data: property }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("properties")
      .select("name, address_line1")
      .eq("id", parsed.data.propertyId)
      .maybeSingle(),
  ]);

  after(
    notifyAdminOfBlockRequest({
      ownerEmail: profile?.email ?? user.email ?? "unknown",
      ownerName: profile?.full_name ?? null,
      propertyLabel:
        property?.name?.trim() || property?.address_line1 || "Property",
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      note: parsed.data.note ?? null,
    }),
  );

  revalidatePath("/portal/calendar");
  return { ok: true };
}

export type DecisionResult = { ok: true } | { ok: false; error: string };

const DecisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "declined"]),
});

export async function decideBlockRequest(
  input: unknown,
): Promise<DecisionResult> {
  const parsed = DecisionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin")
    return { ok: false, error: "Admins only." };

  const { error } = await supabase
    .from("block_requests")
    .update({ status: parsed.data.decision })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/block-requests");
  revalidatePath("/portal/calendar");
  return { ok: true };
}
