import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listInvoicesForOwner, fetchPaymentMethod, type InvoiceRow, type StripePaymentMethod } from "@/lib/stripe";

export type EntityBilling = {
  totalCollectedCents: number;
  nextInvoice: { amountCents: number; dueAt: string } | null;
  invoices: InvoiceRow[];
  managementFeePercent: number | null;
  propertyCount: number;
  paymentMethod: StripePaymentMethod | null;
};

export async function fetchEntityBilling(
  profileId: string,
  contactId: string,
  propertyCount: number,
): Promise<EntityBilling> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const [invoices, { data: contactRow }, paymentMethod] = await Promise.all([
    listInvoicesForOwner(profileId),
    supabaseAny
      .from("contacts")
      .select("management_fee_percent")
      .eq("id", contactId)
      .maybeSingle() as Promise<{ data: { management_fee_percent: number | null } | null }>,
    fetchPaymentMethod(profileId),
  ]);

  const totalCollectedCents = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount_cents, 0);

  const openInvoices = invoices
    .filter((inv) => (inv.status === "open" || inv.status === "draft") && inv.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
  const nextInvoice = openInvoices[0]
    ? { amountCents: openInvoices[0].amount_cents, dueAt: openInvoices[0].due_at! }
    : null;

  return {
    totalCollectedCents,
    nextInvoice,
    invoices,
    managementFeePercent: contactRow?.management_fee_percent ?? null,
    propertyCount,
    paymentMethod,
  };
}
