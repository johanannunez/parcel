// apps/web/src/lib/admin/onboarding-templates.ts

export type OnboardingPhase = 'documents' | 'finances' | 'listings';

export type OnboardingTaskTemplate = {
  title: string;
  phase: OnboardingPhase;
  estimatedMinutes: number;
};

export const ONBOARDING_PHASE_TOTALS: Record<OnboardingPhase, number> = {
  documents: 10,
  finances:  6,
  listings:  16,
};

export const ONBOARDING_TASKS: OnboardingTaskTemplate[] = [
  // Documents (10) — owner provides
  { title: 'Host Rental Agreement',          phase: 'documents', estimatedMinutes: 15 },
  { title: 'Paid Initial Onboarding Fee',    phase: 'documents', estimatedMinutes: 10 },
  { title: 'ACH Authorization Form',         phase: 'documents', estimatedMinutes: 10 },
  { title: 'Card Authorization Form',        phase: 'documents', estimatedMinutes: 10 },
  { title: 'W9 Form',                        phase: 'documents', estimatedMinutes: 10 },
  { title: 'Identity Verification',          phase: 'documents', estimatedMinutes:  5 },
  { title: 'Property Setup Form',            phase: 'documents', estimatedMinutes: 15 },
  { title: 'Wi-Fi Account Information',      phase: 'documents', estimatedMinutes:  5 },
  { title: 'Recommendations for Guidebook',  phase: 'documents', estimatedMinutes: 20 },
  { title: 'Block Dates on the Calendar',    phase: 'documents', estimatedMinutes: 10 },
  // Finances (6) — admin sets up
  { title: 'Technology Fee',                 phase: 'finances',  estimatedMinutes: 10 },
  { title: 'Airbnb (Payout & Taxes)',        phase: 'finances',  estimatedMinutes: 15 },
  { title: 'Hospitable (Payouts)',           phase: 'finances',  estimatedMinutes: 10 },
  { title: 'Price Labs (Pricing)',           phase: 'finances',  estimatedMinutes: 15 },
  { title: 'VRBO (Payout & Taxes)',          phase: 'finances',  estimatedMinutes: 15 },
  { title: 'Owner Card on Turno',            phase: 'finances',  estimatedMinutes: 10 },
  // Listings (16) — admin creates, owner has visibility
  { title: 'Client Account',                phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Airbnb',                        phase: 'listings',  estimatedMinutes: 20 },
  { title: 'VRBO',                          phase: 'listings',  estimatedMinutes: 20 },
  { title: 'Hospitable',                    phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Turno',                         phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Booking.com',                   phase: 'listings',  estimatedMinutes: 20 },
  { title: 'Furnished Finder',              phase: 'listings',  estimatedMinutes: 20 },
  { title: 'Turbo Tenant',                  phase: 'listings',  estimatedMinutes: 15 },
  { title: 'ALE Solutions',                 phase: 'listings',  estimatedMinutes: 15 },
  { title: 'CRS Temporary Housing',         phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Sedgwick',                      phase: 'listings',  estimatedMinutes: 15 },
  { title: 'TaCares',                       phase: 'listings',  estimatedMinutes: 15 },
  { title: 'The Link Housing',              phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Alacrity',                      phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Build MP',                      phase: 'listings',  estimatedMinutes: 15 },
  { title: 'CHBO',                          phase: 'listings',  estimatedMinutes: 15 },
];

export function phaseTag(phase: OnboardingPhase): string {
  return `onboarding:${phase}`;
}
