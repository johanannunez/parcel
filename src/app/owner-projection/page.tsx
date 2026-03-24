import type { Metadata } from "next";
import { spokane8thAve } from "@/content/projections/spokane-8th-ave";
import { calculateAllMonths, calculateAnnualSummary } from "@/lib/projection-calc";
import ProjectionHeader from "@/components/projection/ProjectionHeader";
import SummaryMetrics from "@/components/projection/SummaryMetrics";
import OwnerEconomics from "@/components/projection/OwnerEconomics";
import RevenueChart from "@/components/projection/RevenueChart";
import MonthlyBreakdownTable from "@/components/projection/MonthlyBreakdownTable";
import ProjectionCTA from "@/components/projection/ProjectionCTA";

export const metadata: Metadata = {
  title: "Owner Revenue Projection | The Parcel Company",
  description:
    "Market analysis and projected owner income for 403 E 8th Ave, Spokane, WA 99202.",
};

export default function OwnerProjectionPage() {
  const data = spokane8thAve;
  const months = calculateAllMonths(data.monthlyData, data.economics);
  const annual = calculateAnnualSummary(months);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <ProjectionHeader
        property={data.property}
        compSet={data.compSet}
        generatedDate={data.generatedDate}
      />

      <SummaryMetrics stats={data.summary} />

      <OwnerEconomics
        annual={annual}
        managementFeePercent={data.economics.managementFeePercent}
        cleaningFeePerTurnover={data.economics.cleaningFeePerTurnover}
        avgStayNights={data.economics.avgStayNights}
        occupancyRate={data.economics.occupancyRate}
      />

      <RevenueChart
        monthlyData={data.monthlyData}
        averageMonthly={Math.round(annual.totalRentalRevenue / 12)}
      />

      <MonthlyBreakdownTable
        months={months}
        annual={annual}
        managementFeePercent={data.economics.managementFeePercent}
      />

      <ProjectionCTA
        netAnnual={annual.totalNetOwnerIncome}
        managementFeePercent={data.economics.managementFeePercent}
      />
    </div>
  );
}
