import type { OwnerDetailData } from "@/lib/admin/owner-detail";
import { OverviewOnboarding } from "./OverviewOnboarding";
import { OverviewOperating } from "./OverviewOperating";
import { OverviewLead } from "./OverviewLead";
import { OverviewDormant } from "./OverviewDormant";

/**
 * Picks the right Overview presentation based on the `overviewState`
 * derived in the data fetcher. Four states:
 *
 *   lead     - contacts.lifecycle_stage is in the pre-onboarding pipeline
 *   onboarding - owner profile + properties not yet fully set up
 *   operating  - fully live owner
 *   dormant  - contacts.lifecycle_stage is paused or churned
 */
export function OverviewTab({
  data,
  lifetimeRevenueCents,
}: {
  data: OwnerDetailData;
  lifetimeRevenueCents?: number | null;
}) {
  switch (data.overviewState) {
    case "lead":
      return <OverviewLead data={data} />;
    case "dormant":
      return <OverviewDormant data={data} />;
    case "onboarding":
      return <OverviewOnboarding data={data} lifetimeRevenueCents={lifetimeRevenueCents} />;
    case "operating":
      return <OverviewOperating data={data} lifetimeRevenueCents={lifetimeRevenueCents} />;
  }
}
