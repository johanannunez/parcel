import type { SupabaseClient } from "@supabase/supabase-js";

/* ─── Status types ─── */

export type ChecklistStatus = "not_started" | "in_progress" | "pending_owner" | "stuck" | "completed";
export type ChecklistCategory = "documents" | "finances" | "listings";

export type ChecklistItem = {
  id: string;
  property_id: string;
  category: ChecklistCategory;
  item_key: string;
  label: string;
  status: ChecklistStatus;
  sort_order: number;
  notes: string | null;
  updated_at: string;
  created_at: string;
};

/* ─── Template definition (32 items from the master spreadsheet) ─── */

type TemplateItem = {
  category: ChecklistCategory;
  item_key: string;
  label: string;
  sort_order: number;
  url?: string;
};

export const CHECKLIST_TEMPLATE: TemplateItem[] = [
  // Documents (10)
  { category: "documents", item_key: "host_rental_agreement", label: "Host Rental Agreement", sort_order: 1 },
  { category: "documents", item_key: "paid_onboarding_fee", label: "Paid Initial Onboarding Fee", sort_order: 2 },
  { category: "documents", item_key: "ach_authorization", label: "ACH Authorization Form", sort_order: 3 },
  { category: "documents", item_key: "card_authorization", label: "Card Authorization Form", sort_order: 4 },
  { category: "documents", item_key: "w9_form", label: "W9 Form", sort_order: 5 },
  { category: "documents", item_key: "identity_verification", label: "Identity Verification: DL Upload", sort_order: 6 },
  { category: "documents", item_key: "property_setup_form", label: "Property Setup Form", sort_order: 7 },
  { category: "documents", item_key: "wifi_info", label: "Wi-Fi Account Information", sort_order: 8 },
  { category: "documents", item_key: "guidebook_recommendations", label: "Recommendations for Guidebook", sort_order: 9 },
  { category: "documents", item_key: "block_dates_calendar", label: "Block Dates on the Calendar", sort_order: 10 },

  // Finances (6)
  { category: "finances", item_key: "technology_fee", label: "Technology Fee", sort_order: 1 },
  { category: "finances", item_key: "airbnb_payout_taxes", label: "AirBNB (Payout & Taxes)", sort_order: 2, url: "https://www.airbnb.com/hosting" },
  { category: "finances", item_key: "hospitable_payouts", label: "Hospitable (Payouts)", sort_order: 3, url: "https://app.hospitable.com" },
  { category: "finances", item_key: "price_labs_pricing", label: "Price Labs (Pricing)", sort_order: 4, url: "https://pricelabs.co" },
  { category: "finances", item_key: "vrbo_payout_taxes", label: "VRBO (Payout & Taxes)", sort_order: 5, url: "https://www.vrbo.com/host" },
  { category: "finances", item_key: "owner_card_turno", label: "Owner Card on Turno", sort_order: 6, url: "https://turno.com" },

  // Listings (16)
  { category: "listings", item_key: "client_account", label: "Client Account", sort_order: 1 },
  { category: "listings", item_key: "airbnb", label: "AirBNB", sort_order: 2, url: "https://www.airbnb.com/hosting" },
  { category: "listings", item_key: "vrbo", label: "VRBO", sort_order: 3, url: "https://www.vrbo.com/host" },
  { category: "listings", item_key: "hospitable", label: "Hospitable", sort_order: 4, url: "https://app.hospitable.com" },
  { category: "listings", item_key: "turno", label: "Turno", sort_order: 5, url: "https://turno.com" },
  { category: "listings", item_key: "booking_com", label: "Booking.com", sort_order: 6, url: "https://admin.booking.com" },
  { category: "listings", item_key: "furnished_finder", label: "Furnished Finder", sort_order: 7, url: "https://www.furnishedfinder.com" },
  { category: "listings", item_key: "turbo_tenant", label: "Turbo Tenant", sort_order: 8, url: "https://www.turbotenant.com" },
  { category: "listings", item_key: "ale_solutions", label: "ALE Solutions", sort_order: 9, url: "https://www.alesolutions.com" },
  { category: "listings", item_key: "crs_temporary_housing", label: "CRS Temporary Housing", sort_order: 10, url: "https://www.crstemporaryhousing.com" },
  { category: "listings", item_key: "sedgwick", label: "Sedgwick", sort_order: 11, url: "https://www.sedgwick.com" },
  { category: "listings", item_key: "tacares", label: "TaCares", sort_order: 12 },
  { category: "listings", item_key: "the_link_housing", label: "The Link Housing", sort_order: 13 },
  { category: "listings", item_key: "alacrity", label: "Alacrity", sort_order: 14, url: "https://www.alacritysolutions.com" },
  { category: "listings", item_key: "build_mp", label: "Build MP", sort_order: 15 },
  { category: "listings", item_key: "chbo", label: "CHBO", sort_order: 16, url: "https://www.corporatehousingbyowner.com" },
];

/* ─── Quick link lookup by item_key ─── */

const URL_MAP = new Map(
  CHECKLIST_TEMPLATE.filter((t) => t.url).map((t) => [t.item_key, t.url!]),
);

export function getItemUrl(itemKey: string): string | undefined {
  return URL_MAP.get(itemKey);
}

/* ─── Status display config ─── */

export const STATUS_CONFIG: Record<ChecklistStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", color: "#ffffff", bg: "#4b5563" },
  in_progress: { label: "In Progress", color: "#ffffff", bg: "#d97706" },
  pending_owner: { label: "Pending Owner", color: "#ffffff", bg: "#7c3aed" },
  stuck: { label: "Stuck", color: "#ffffff", bg: "#dc2626" },
  completed: { label: "Completed", color: "#ffffff", bg: "#16a34a" },
};

/* ─── Queries ─── */

export async function getChecklistItemsForProperties(
  supabase: SupabaseClient,
  propertyIds: string[],
): Promise<ChecklistItem[]> {
  if (propertyIds.length === 0) return [];

  // Cast through any: table not in generated types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("property_checklist_items")
    .select("*")
    .in("property_id", propertyIds)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[Checklist] Failed to fetch items:", error);
    return [];
  }
  return (data ?? []) as ChecklistItem[];
}

/* ─── Summary helpers ─── */

export function computeChecklistStats(items: ChecklistItem[]) {
  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const pendingOwner = items.filter((i) => i.status === "pending_owner").length;
  const stuck = items.filter((i) => i.status === "stuck").length;
  const notStarted = items.filter((i) => i.status === "not_started").length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, inProgress, pendingOwner, stuck, notStarted, pct };
}
