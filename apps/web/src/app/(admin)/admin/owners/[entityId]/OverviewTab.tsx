import type { OwnerDetailData } from "@/lib/admin/owner-detail";
import { OverviewOnboarding } from "./OverviewOnboarding";
import { OverviewOperating } from "./OverviewOperating";

/**
 * Picks the right Overview presentation based on the `overviewState`
 * derived in the data fetcher. Heuristic (documented in owner-detail.ts):
 *   - onboarding: primary profile hasn't completed onboarding OR any
 *     property isn't published
 *   - operating: both conditions clear
 */
export function OverviewTab({ data }: { data: OwnerDetailData }) {
  if (data.overviewState === "onboarding") {
    return <OverviewOnboarding data={data} />;
  }
  return <OverviewOperating data={data} />;
}
