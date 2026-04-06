"use client";

import { useState, useMemo } from "react";
import { Calculator, CurrencyDollar, Bed, MapPin, House } from "@phosphor-icons/react";
import ScrollReveal from "./ScrollReveal";

const PROPERTY_TYPES = [
  { value: "single-family", label: "Single Family Home" },
  { value: "condo", label: "Condo / Apartment" },
  { value: "cabin", label: "Cabin / Cottage" },
  { value: "townhouse", label: "Townhouse" },
] as const;

const LOCATIONS = [
  { value: "richland", label: "Richland, WA" },
  { value: "kennewick", label: "Kennewick, WA" },
  { value: "pasco", label: "Pasco, WA" },
  { value: "tri-cities-other", label: "Other Tri-Cities Area" },
] as const;

// Market data estimates for Tri-Cities, WA vacation rentals (per night by bedroom count)
const RATE_DATA: Record<string, Record<number, { low: number; high: number }>> = {
  "single-family": {
    1: { low: 95, high: 135 },
    2: { low: 120, high: 175 },
    3: { low: 155, high: 225 },
    4: { low: 195, high: 285 },
    5: { low: 240, high: 350 },
    6: { low: 280, high: 400 },
  },
  condo: {
    1: { low: 80, high: 120 },
    2: { low: 105, high: 160 },
    3: { low: 135, high: 200 },
    4: { low: 170, high: 250 },
    5: { low: 200, high: 300 },
    6: { low: 230, high: 340 },
  },
  cabin: {
    1: { low: 100, high: 150 },
    2: { low: 130, high: 190 },
    3: { low: 170, high: 245 },
    4: { low: 210, high: 310 },
    5: { low: 260, high: 380 },
    6: { low: 300, high: 430 },
  },
  townhouse: {
    1: { low: 85, high: 125 },
    2: { low: 110, high: 165 },
    3: { low: 145, high: 210 },
    4: { low: 180, high: 265 },
    5: { low: 220, high: 320 },
    6: { low: 260, high: 370 },
  },
};

// Location multipliers
const LOCATION_MULT: Record<string, number> = {
  richland: 1.1,
  kennewick: 1.0,
  pasco: 0.95,
  "tri-cities-other": 1.0,
};

const AVG_OCCUPANCY = 0.68; // 68% average for Tri-Cities vacation rentals

export default function RevenueCalculator() {
  const [propertyType, setPropertyType] = useState("single-family");
  const [bedrooms, setBedrooms] = useState(2);
  const [location, setLocation] = useState("richland");

  const estimates = useMemo(() => {
    const clampedBeds = Math.min(Math.max(bedrooms, 1), 6);
    const rates = RATE_DATA[propertyType]?.[clampedBeds] ?? RATE_DATA["single-family"][2];
    const mult = LOCATION_MULT[location] ?? 1.0;

    const nightsPerMonth = 30 * AVG_OCCUPANCY;
    const monthlyLow = Math.round(rates.low * mult * nightsPerMonth);
    const monthlyHigh = Math.round(rates.high * mult * nightsPerMonth);
    const annualLow = monthlyLow * 12;
    const annualHigh = monthlyHigh * 12;

    return { monthlyLow, monthlyHigh, annualLow, annualHigh };
  }, [propertyType, bedrooms, location]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <section id="revenue-calculator" className="bg-warm-gray-50 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        <ScrollReveal>
          <p className="text-label text-brand">Revenue Estimator</p>
          <h2 className="text-h2 mt-3 text-text-primary">
            See what your property could earn
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-text-secondary md:text-lg">
            Get a personalized revenue estimate based on Tri-Cities market data.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
            {/* Calculator Inputs */}
            <div className="lg:col-span-2">
              <div className="space-y-6 rounded-[var(--radius-lg)] border border-warm-gray-100 bg-surface-elevated p-6 shadow-card md:p-8">
                {/* Property Type */}
                <div>
                  <label htmlFor="calc-property-type" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <House size={18} weight="bold" className="text-brand" aria-hidden="true" />
                    Property Type
                  </label>
                  <select
                    id="calc-property-type"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="mt-2 block w-full rounded-[var(--radius-md)] border border-warm-gray-200 bg-surface px-4 py-3 text-sm font-medium text-text-primary outline-none transition-colors focus-visible:border-brand"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bedrooms */}
                <div>
                  <label htmlFor="calc-bedrooms" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <Bed size={18} weight="bold" className="text-brand" aria-hidden="true" />
                    Bedrooms
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id="calc-bedrooms"
                      type="range"
                      min={1}
                      max={6}
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-warm-gray-200 accent-brand"
                    />
                    <span className="min-w-[2rem] text-center text-lg font-bold text-text-primary">
                      {bedrooms}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="calc-location" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <MapPin size={18} weight="bold" className="text-brand" aria-hidden="true" />
                    Location
                  </label>
                  <select
                    id="calc-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2 block w-full rounded-[var(--radius-md)] border border-warm-gray-200 bg-surface px-4 py-3 text-sm font-medium text-text-primary outline-none transition-colors focus-visible:border-brand"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-navy p-8 text-white md:p-10">
                {/* Accent blurs */}
                <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-brand/20 blur-[80px]" />
                <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-brand-light/15 blur-[80px]" />

                <div className="relative">
                  <div className="flex items-center gap-2">
                    <Calculator size={22} weight="bold" className="text-brand-light" aria-hidden="true" />
                    <p className="text-label text-white/60">Estimated Revenue</p>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
                    {/* Monthly */}
                    <div>
                      <p className="text-sm font-medium text-white/50">Monthly</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
                        {formatCurrency(estimates.monthlyLow)}
                        <span className="mx-2 text-lg text-white/40">&ndash;</span>
                        {formatCurrency(estimates.monthlyHigh)}
                      </p>
                    </div>

                    {/* Annual */}
                    <div>
                      <p className="text-sm font-medium text-white/50">Annual</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
                        {formatCurrency(estimates.annualLow)}
                        <span className="mx-2 text-lg text-white/40">&ndash;</span>
                        {formatCurrency(estimates.annualHigh)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-start gap-2 rounded-[var(--radius-md)] bg-white/5 px-4 py-3">
                    <CurrencyDollar size={18} weight="bold" className="mt-0.5 shrink-0 text-brand-light" aria-hidden="true" />
                    <p className="text-sm leading-relaxed text-white/60">
                      Based on {Math.round(AVG_OCCUPANCY * 100)}% average occupancy for Tri-Cities vacation rentals. Actual results vary by season, amenities, and listing quality.
                    </p>
                  </div>

                  <a
                    href="/contact"
                    className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light to-brand px-8 py-3 text-base font-semibold text-white transition-opacity duration-300 hover:opacity-90"
                  >
                    Get a personalized estimate
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
