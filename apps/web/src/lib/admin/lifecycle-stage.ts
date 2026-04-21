import type { LifecycleStage, StageGroup } from './contact-types';

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  lead_new: 'Inquiry',
  qualified: 'Qualified',
  in_discussion: 'In Talks',
  contract_sent: 'Contract Sent',
  onboarding: 'Onboarding',
  active_owner: 'Active Owner',
  offboarding: 'Offboarding',
  lead_cold: 'Cold Lead',
  paused: 'Paused',
  churned: 'Churned',
};

const GROUP_MAP: Record<LifecycleStage, StageGroup> = {
  lead_new: 'lead',
  qualified: 'lead',
  in_discussion: 'lead',
  contract_sent: 'lead',
  onboarding: 'onboarding',
  active_owner: 'active',
  offboarding: 'dormant',
  lead_cold: 'cold',
  paused: 'dormant',
  churned: 'dormant',
};

export function stageLabel(stage: LifecycleStage): string {
  return STAGE_LABEL[stage];
}

export function stageGroup(stage: LifecycleStage): StageGroup {
  return GROUP_MAP[stage];
}

export function isLeadStage(stage: LifecycleStage): boolean {
  return GROUP_MAP[stage] === 'lead';
}

export function isActiveStage(stage: LifecycleStage): boolean {
  return GROUP_MAP[stage] === 'active' || GROUP_MAP[stage] === 'onboarding';
}

export const STAGE_COLOR: Record<StageGroup, string> = {
  lead: '#02AAEB',
  onboarding: '#8B5CF6',
  active: '#10B981',
  cold: '#0369A1',
  dormant: '#6B7280',
};

export function stageColor(stage: LifecycleStage): string {
  return STAGE_COLOR[GROUP_MAP[stage]];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
