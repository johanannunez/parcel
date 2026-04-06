"use client";

import { ArrowRight } from "@phosphor-icons/react";
import ScrollReveal from "./ScrollReveal";

export default function CTASection() {
  return (
    <section aria-label="Call to action" className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-navy px-8 py-16 text-center md:px-16 md:py-24">
            {/* Subtle Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Gradient Accent */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand/20 blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-brand-light/15 blur-[100px]" />

            <div className="relative">
              <h2 className="text-h1 mx-auto max-w-xl text-white">
                Ready to find your next stay?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-white/80">
                Browse our full collection of vacation homes and furnished
                residences.
              </p>
              <a
                href="/properties"
                className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light to-brand px-8 py-3.5 text-base font-semibold text-white transition-opacity duration-300 hover:opacity-90"
              >
                View all properties
                <ArrowRight size={18} weight="bold" />
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
