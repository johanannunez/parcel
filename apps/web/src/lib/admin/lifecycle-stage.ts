import type { LifecycleStage, StageGroup } from './contact-types';

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  lead_new: 'Inquiry',
  qualified: 'Qualified',
  in_discussion: 'In Talks',
  contract_sent: 'Contract Sent',
  onboarding: 'Onboarding',
  active_owner: 'Active Owner',
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
