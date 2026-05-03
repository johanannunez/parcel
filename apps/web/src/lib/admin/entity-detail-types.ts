/**
 * Pure-type module for the admin entity detail page. Client components
 * import from here so they never pull in the server-only data fetcher
 * (which would drag `@/lib/supabase/server` into the client bundle).
 */

export type OverviewState = 'lead' | 'onboarding' | 'operating' | 'dormant';
export type EntityStatus = "active" | "invited" | "not_invited" | "setting_up";

export type EntityDetailMember = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  onboardingCompletedAt: string | null;
  isPending: boolean;
};

export type EntityDetailProperty = {
  id: string;
  label: string;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  setupStatus: string;
  active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  createdAt: string;
};

export type EntityDetailActivityEntry = {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type EntityDetailRecord = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

export type EntityDetailSwitcherRow = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  propertyCount: number;
  status: EntityStatus;
};

export type EntityDetailData = {
  entity: EntityDetailRecord;
  members: EntityDetailMember[];
  primaryMember: EntityDetailMember;
  properties: EntityDetailProperty[];
  propertyCount: number;
  activity: EntityDetailActivityEntry[];
  status: EntityStatus;
  overviewState: OverviewState;
  switcher: EntityDetailSwitcherRow[];
  // Contact-linked fields (present when a contacts row is linked via profile_id).
  contactId: string | null;
  source: string | null;
  sourceDetail: string | null;
  estimatedMrr: number | null;
  stageChangedAt: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  pausedAt: string | null;
  lifetimePayouts: number | null;
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
