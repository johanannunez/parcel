import type { MonthlyData, OwnerEconomicsConfig } from "@/types/projection";

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface MonthlyBreakdown {
  month: string;
  rentalRevenue: number;
  turnovers: number;
  cleaningRevenue: number;
  totalGross: number;
  managementFee: number;
  cleaningCost: number;
  netOwnerIncome: number;
}

export function calculateMonthlyBreakdown(
  data: MonthlyData,
  economics: OwnerEconomicsConfig,
  monthIndex: number,
): MonthlyBreakdown {
  const days = DAYS_IN_MONTH[monthIndex];
  const occupiedNights = days * economics.occupancyRate;
  const turnovers = Math.round(occupiedNights / economics.avgStayNights);

  const rentalRevenue = data.revenue;
  const cleaningRevenue = turnovers * economics.cleaningFeePerTurnover;
  const totalGross = rentalRevenue + cleaningRevenue;
  const managementFee = Math.round(totalGross * economics.managementFeePercent);
  const cleaningCost = turnovers * economics.cleaningCostPerTurnover;
  const netOwnerIncome = totalGross - managementFee - cleaningCost;

  return {
    month: data.month,
    rentalRevenue,
    turnovers,
    cleaningRevenue,
    totalGross,
    managementFee,
    cleaningCost,
    netOwnerIncome,
  };
}

export function calculateAllMonths(
  monthlyData: MonthlyData[],
  economics: OwnerEconomicsConfig,
): MonthlyBreakdown[] {
  return monthlyData.map((data, i) => calculateMonthlyBreakdown(data, economics, i));
}

export interface AnnualSummary {
  totalRentalRevenue: number;
  totalCleaningRevenue: number;
  totalGross: number;
  totalManagementFee: number;
  totalCleaningCost: number;
  totalNetOwnerIncome: number;
  totalTurnovers: number;
  avgMonthlyNet: number;
}

export function calculateAnnualSummary(months: MonthlyBreakdown[]): AnnualSummary {
  const totals = months.reduce(
    (acc, m) => ({
      rentalRevenue: acc.rentalRevenue + m.rentalRevenue,
      cleaningRevenue: acc.cleaningRevenue + m.cleaningRevenue,
      totalGross: acc.totalGross + m.totalGross,
      managementFee: acc.managementFee + m.managementFee,
      cleaningCost: acc.cleaningCost + m.cleaningCost,
      netOwnerIncome: acc.netOwnerIncome + m.netOwnerIncome,
      turnovers: acc.turnovers + m.turnovers,
    }),
    {
      rentalRevenue: 0,
      cleaningRevenue: 0,
      totalGross: 0,
      managementFee: 0,
      cleaningCost: 0,
      netOwnerIncome: 0,
      turnovers: 0,
    },
  );

  return {
    totalRentalRevenue: totals.rentalRevenue,
    totalCleaningRevenue: totals.cleaningRevenue,
    totalGross: totals.totalGross,
    totalManagementFee: totals.managementFee,
    totalCleaningCost: totals.cleaningCost,
    totalNetOwnerIncome: totals.netOwnerIncome,
    totalTurnovers: totals.turnovers,
    avgMonthlyNet: Math.round(totals.netOwnerIncome / 12),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
