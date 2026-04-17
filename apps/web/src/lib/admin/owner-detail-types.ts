import type { OwnerStatus } from "@/lib/admin/owners-list";

/**
 * Pure-type module for the admin owner detail page. Client components
 * import from here so they never pull in the server-only data fetcher
 * (which would drag `@/lib/supabase/server` into the client bundle).
 */

export type OwnerDetailMember = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  onboardingCompletedAt: string | null;
  isPending: boolean;
};

export type OwnerDetailProperty = {
  id: string;
  label: string;
  city: string | null;
  state: string | null;
  setupStatus: string;
  active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  createdAt: string;
};

export type OwnerDetailActivityEntry = {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type OwnerDetailEntity = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

export type OwnerDetailSwitcherRow = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  propertyCount: number;
  status: OwnerStatus;
};

export type OwnerDetailData = {
  entity: OwnerDetailEntity;
  members: OwnerDetailMember[];
  primaryMember: OwnerDetailMember;
  properties: OwnerDetailProperty[];
  propertyCount: number;
  activity: OwnerDetailActivityEntry[];
  status: OwnerStatus;
  overviewState: "onboarding" | "operating";
  switcher: OwnerDetailSwitcherRow[];
};

/** Short month/year label: "Apr 2026". Safe for client code. */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
