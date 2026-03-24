"use client";

import { Star, Quotes } from "@phosphor-icons/react";
import ScrollReveal from "./ScrollReveal";

const TESTIMONIALS = [
  {
    id: "1",
    quote:
      "The property was exactly as described. Spotless, beautifully furnished, and in the perfect location. We extended our stay by a week.",
    name: "Sarah K.",
    location: "Denver, CO",
    rating: 5,
  },
  {
    id: "2",
    quote:
      "I travel for work constantly and these corporate residences are a game changer. Feels like home, not a hotel room. The booking process was seamless.",
    name: "Marcus T.",
    location: "Austin, TX",
    rating: 5,
  },
  {
    id: "3",
    quote:
      "Our family reunion at the lakeside villa was unforgettable. Eight of us had plenty of space, and the private dock was the highlight.",
    name: "Jennifer M.",
    location: "Atlanta, GA",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16">
        <ScrollReveal>
          <p className="text-label text-brand">Guest experiences</p>
          <h2 className="text-h2 mt-3 text-text-primary">
            Hear from people who stayed
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.id} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-warm-gray-100 bg-white p-6 transition-shadow duration-500 hover:shadow-md md:p-8">
                {/* Quote Icon */}
                <Quotes
                  size={28}
                  weight="fill"
                  className="text-brand/20"
                />

                {/* Stars */}
                <div className="mt-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      size={16}
                      weight="fill"
                      className="text-star"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="mt-4 flex-1 text-base leading-relaxed text-text-secondary">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-light to-brand text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {t.name}
                    </p>
                    <p className="text-xs text-text-tertiary">{t.location}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
