export type LifecycleStage =
  | 'lead_new'
  | 'qualified'
  | 'in_discussion'
  | 'contract_sent'
  | 'onboarding'
  | 'active_owner'
  | 'paused'
  | 'churned';

export type StageGroup = 'lead' | 'onboarding' | 'active' | 'dormant';

export const CONTACT_VIEW_MODES = ['status', 'gallery', 'compact'] as const;
export type ContactViewMode = typeof CONTACT_VIEW_MODES[number];

export type ContactRow = {
  id: string;
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
  lastActivityAt: string | null;
  createdAt: string;
};

export type ContactSavedView = {
  key: string;
  name: string;
  filterStages: LifecycleStage[];
  lastActivityOlderThanDays?: number;
  sort: 'name_asc' | 'recent_activity' | 'stage_age';
  viewMode: ContactViewMode;
  sortOrder: number;
  count: number;
};
