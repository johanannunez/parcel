"use client";

import {
  MagnifyingGlass,
  CheckCircle,
  CalendarCheck,
} from "@phosphor-icons/react";
import ScrollReveal from "./ScrollReveal";

const STEPS = [
  {
    number: "01",
    title: "Search",
    description: "Pick your dates, location, and number of guests.",
    icon: MagnifyingGlass,
  },
  {
    number: "02",
    title: "Choose",
    description:
      "Browse verified properties with real photos and honest descriptions.",
    icon: CheckCircle,
  },
  {
    number: "03",
    title: "Book",
    description: "Confirm your stay. Flexible cancellation included.",
    icon: CalendarCheck,
  },
];

export default function HowItWorksSection() {
  return (
    <section aria-label="How it works" className="bg-warm-gray-50 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        <ScrollReveal>
          <p className="text-label text-brand">How it works</p>
          <h2 className="text-h2 mt-3 text-text-primary">
            Book in three steps
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.1}>
              <div className="relative">
                {/* Connector Line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-10 right-0 hidden h-[1px] w-full translate-x-1/2 bg-warm-gray-200 md:block" />
                )}

                {/* Icon */}
                <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-md)] bg-surface-elevated shadow-card">
                  <step.icon size={28} weight="bold" className="text-brand" />
                </div>

                {/* Number */}
                <p className="mt-6 text-xs font-bold text-text-tertiary">
                  {step.number}
                </p>

                {/* Content */}
                <h3 className="mt-1 text-xl font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
