export type LifecycleStage =
  | 'lead_new'
  | 'qualified'
  | 'in_discussion'
  | 'contract_sent'
  | 'onboarding'
  | 'active_owner'
  | 'offboarding'
  | 'lead_cold'
  | 'paused'
  | 'churned';

export type StageGroup = 'lead' | 'onboarding' | 'active' | 'cold' | 'dormant';

export const CONTACT_VIEW_MODES = ['status', 'gallery', 'compact', 'map'] as const;
export type ContactViewMode = typeof CONTACT_VIEW_MODES[number];

export type ContactProperty = {
  id: string;
  addressLine1: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ContactRow = {
  id: string;
  entityId: string | null;
  profileId: string | null;
  fullName: string;
  displayName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  source: string | null;
  sourceDetail: string | null;
  lifecycleStage: LifecycleStage;
  stageChangedAt: string;
  assignedTo: string | null;
  assignedToName: string | null;
  estimatedMrr: number | null;
  propertyCount: number;
  properties: ContactProperty[];
  lastActivityAt: string | null;
  createdAt: string;
};

export type ContactSavedViewSearchParams = {
  view?: string;
  mode?: string;
  source?: string;
  assignee?: string;
  q?: string;
};

export type ContactSavedView = {
  id: string;
  key: string;
  name: string;
  filterStages: LifecycleStage[];
  lastActivityOlderThanDays?: number;
  sort: 'name_asc' | 'recent_activity' | 'stage_age';
  viewMode: ContactViewMode;
  sortOrder: number;
  count: number | null;
  isPersonal: boolean;
  searchParams: ContactSavedViewSearchParams | null;
  iconId: string | null;
  iconColor: string | null;
};
