"use client";

import { House, Buildings } from "@phosphor-icons/react";
import ScrollReveal from "./ScrollReveal";

const CATEGORIES = [
  {
    title: "Vacation Rentals",
    description: "Cabins, villas, and retreats for your next getaway.",
    icon: House,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format",
    count: "8+",
  },
  {
    title: "Corporate Residences",
    description: "Furnished homes for business travel and relocations.",
    icon: Buildings,
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format",
    count: "5+",
  },
];

export default function CategoriesSection() {
  return (
    <section className="bg-warm-gray-50 py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        <ScrollReveal>
          <p className="text-label text-brand">Stay your way</p>
          <h2 className="text-h2 mt-3 text-text-primary">Two ways to book</h2>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {CATEGORIES.map((cat, i) => (
            <ScrollReveal key={cat.title} delay={i * 0.1}>
              <a
                href="/properties"
                className="group relative block overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-card transition-shadow duration-500 hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    style={{ backgroundImage: `url('${cat.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                  {/* Count Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-text-primary backdrop-blur-sm">
                      {cat.count} properties
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light/10 to-brand/10">
                      <cat.icon
                        size={22}
                        weight="bold"
                        className="text-brand"
                      />
                    </div>
                    <h3 className="text-h3 text-text-primary">{cat.title}</h3>
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-text-secondary">
                    {cat.description}
                  </p>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
