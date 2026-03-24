export interface MonthlyData {
  month: string;
  revenue: number;
  rangeLow: number;
  rangeHigh: number;
  activeListings: number;
}

export interface ComparisonStat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sublabel?: string;
  vsCompSet?: number;
}

export interface OwnerEconomicsConfig {
  managementFeePercent: number;
  cleaningFeePerTurnover: number;
  cleaningCostPerTurnover: number;
  avgStayNights: number;
  occupancyRate: number;
}

export interface PropertyInfo {
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  label: string;
}

export interface CompSetInfo {
  matchedListings: number;
  totalListings: number;
  platform: string;
  market: string;
}

export interface MarketProjection {
  property: PropertyInfo;
  compSet: CompSetInfo;
  summary: ComparisonStat[];
  monthlyData: MonthlyData[];
  economics: OwnerEconomicsConfig;
  generatedDate: string;
}
