"use client";

import { ChartLineUp, ShieldCheck, Broom, Camera } from "@phosphor-icons/react";
import ScrollReveal from "./ScrollReveal";

const BENEFITS = [
  {
    icon: ChartLineUp,
    title: "Maximize Revenue",
    description:
      "Dynamic pricing, optimized listings, and multi-platform distribution to keep your calendar full and rates competitive.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted Guests Only",
    description:
      "Every guest is screened. We protect your property while delivering a premium experience that earns five-star reviews.",
  },
  {
    icon: Broom,
    title: "Full-Service Management",
    description:
      "From professional cleaning to 24/7 guest support and maintenance coordination — we handle everything.",
  },
  {
    icon: Camera,
    title: "Professional Presentation",
    description:
      "Professional photography, compelling descriptions, and a listing that stands out on every platform.",
  },
];

export default function ListWithUsBenefits() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        <ScrollReveal>
          <p className="text-label text-brand">Why partner with us</p>
          <h2 className="text-h2 mt-3 text-text-primary">
            Everything your property needs to succeed
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {BENEFITS.map((b, i) => (
            <ScrollReveal key={b.title} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-warm-gray-100 bg-surface-elevated p-6 transition-shadow duration-500 hover:shadow-md md:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-r from-brand-light/10 to-brand/10">
                  <b.icon size={24} weight="bold" className="text-brand" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-text-primary">
                  {b.title}
                </h3>
                <p className="mt-2 flex-1 text-base leading-relaxed text-text-secondary">
                  {b.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
