/* eslint-disable @typescript-eslint/no-explicit-any */
// owner_timeline, block_requests, and related tables are not yet in the
// generated Supabase types. Remove this disable once types are regenerated.
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logTimelineEvent } from "@/lib/timeline";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase: null as never,
      userId: null as never,
      error: "You must be signed in.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      supabase: null as never,
      userId: null as never,
      error: "Admin access required.",
    };
  }

  return { supabase, userId: user.id, error: null };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function insertTimelineEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  data: {
    eventType: string;
    title: string;
    body?: string;
    propertyId?: string;
  },
) {
  const { error } = await (supabase as any).from("owner_timeline").insert({
    owner_id: ownerId,
    event_type: data.eventType,
    title: data.title,
    body: data.body ?? null,
    property_id: data.propertyId ?? null,
  });

  return error;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ---------------------------------------------------------------------------
// RECEIPTS
// ---------------------------------------------------------------------------

export async function createReceipt(
  ownerId: string,
  data: {
    vendor: string;
    amount: number;
    category: string;
    purchaseDate: string;
    propertyId?: string;
    notes?: string;
    visibility?: "visible" | "private";
    imageUrl?: string;
  },
): Promise<{ ok: boolean; message: string }> {
  const { supabase, userId, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await (supabase as any).from("owner_receipts").insert({
    owner_id: ownerId,
    property_id: data.propertyId ?? null,
    vendor: data.vendor,
    amount: data.amount,
    currency: "USD",
    category: data.category,
    purchase_date: data.purchaseDate,
    image_url: data.imageUrl ?? null,
    notes: data.notes ?? null,
    visibility: data.visibility ?? "visible",
    created_by: userId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  void logTimelineEvent({
    ownerId,
    eventType: "receipt_added",
    category: "financial",
    title: `Receipt added: ${formatCurrency(data.amount)} at ${data.vendor} (${data.category})`,
    propertyId: data.propertyId,
    visibility: "owner",
    metadata: { vendor: data.vendor, amount: data.amount, category: data.category },
  });

  revalidatePath(`/admin/entities/${ownerId}`);
  return { ok: true, message: "Receipt added." };
}

export async function updateReceipt(
  receiptId: string,
  ownerId: string,
  data: Partial<{
    vendor: string;
    amount: number;
    category: string;
    purchaseDate: string;
    propertyId: string | null;
    notes: string | null;
    visibility: "visible" | "private";
    imageUrl: string | null;
  }>,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.vendor !== undefined) updatePayload.vendor = data.vendor;
  if (data.amount !== undefined) updatePayload.amount = data.amount;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.purchaseDate !== undefined)
    updatePayload.purchase_date = data.purchaseDate;
  if (data.propertyId !== undefined)
    updatePayload.property_id = data.propertyId;
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.visibility !== undefined) updatePayload.visibility = data.visibility;
  if (data.imageUrl !== undefined) updatePayload.image_url = data.imageUrl;

  const { error } = await (supabase as any)
    .from("owner_receipts")
    .update(updatePayload)
    .eq("id", receiptId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/entities/${ownerId}`);
  return { ok: true, message: "Receipt updated." };
}

export async function deleteReceipt(
  receiptId: string,
  ownerId: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: receipt } = await (supabase as any)
    .from("owner_receipts")
    .select("vendor, amount, currency, category")
    .eq("id", receiptId)
    .eq("owner_id", ownerId)
    .single();

  const { error } = await (supabase as any)
    .from("owner_receipts")
    .delete()
    .eq("id", receiptId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (receipt) {
    void logTimelineEvent({
      ownerId,
      eventType: "receipt_deleted",
      category: "financial",
      title: `Receipt deleted: ${formatCurrency(
        Number(receipt.amount),
        receipt.currency ?? "USD",
      )} at ${receipt.vendor} (${receipt.category})`,
      visibility: "admin_only",
    });
  }

  revalidatePath(`/admin/entities/${ownerId}`);
  return { ok: true, message: "Receipt deleted." };
}

export async function toggleReceiptVisibility(
  receiptId: string,
  ownerId: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: receipt, error: fetchError } = await (supabase as any)
    .from("owner_receipts")
    .select("visibility")
    .eq("id", receiptId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchError || !receipt) {
    return { ok: false, message: "Receipt not found." };
  }

  const newVisibility = receipt.visibility === "private" ? "visible" : "private";

  const { error } = await (supabase as any)
    .from("owner_receipts")
    .update({
      visibility: newVisibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", receiptId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/entities/${ownerId}`);
  return {
    ok: true,
    message: `Receipt is now ${
      newVisibility === "visible" ? "visible to owner" : "private"
    }.`,
  };
}

// ---------------------------------------------------------------------------
// CSV EXPORT
// ---------------------------------------------------------------------------

export async function exportReceiptsCSV(
  ownerId: string,
  year: number,
): Promise<{ ok: boolean; csv?: string; message?: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data: receipts, error } = await (supabase as any)
    .from("owner_receipts")
    .select(
      `
      purchase_date,
      vendor,
      amount,
      currency,
      category,
      visibility,
      notes,
      property:properties(name, address)
    `,
    )
    .eq("owner_id", ownerId)
    .gte("purchase_date", startDate)
    .lte("purchase_date", endDate)
    .order("purchase_date", { ascending: true });

  if (error) {
    return { ok: false, message: error.message };
  }

  const headers = [
    "Date",
    "Vendor",
    "Amount",
    "Currency",
    "Category",
    "Property",
    "Visibility",
    "Notes",
  ];

  const rows: string[] = [headers.join(",")];

  for (const receipt of receipts ?? []) {
    const propertyLabel = receipt.property
      ? receipt.property.name ?? receipt.property.address ?? ""
      : "";

    const amountNumber = Number(receipt.amount);
    const amountFormatted = Number.isFinite(amountNumber)
      ? amountNumber.toFixed(2)
      : "";

    const row = [
      escapeCsvField(receipt.purchase_date),
      escapeCsvField(receipt.vendor),
      escapeCsvField(amountFormatted),
      escapeCsvField(receipt.currency ?? "USD"),
      escapeCsvField(receipt.category),
      escapeCsvField(propertyLabel),
      escapeCsvField(receipt.visibility),
      escapeCsvField(receipt.notes),
    ];

    rows.push(row.join(","));
  }

  return { ok: true, csv: rows.join("\n") };
}
