"use client";

import { Star } from "@phosphor-icons/react";

/* ── Guest quotes data ── */

interface GuestQuote {
  text: string;
  name: string;
  property: string;
}

const QUOTES: GuestQuote[] = [
  {
    text: "Absolutely stunning home. Every detail was thought through. We didn't want to leave.",
    name: "Sarah M.",
    property: "The Spokane Craftsman Cottage",
  },
  {
    text: "Best vacation rental experience we've ever had. The property was immaculate.",
    name: "James & Emily K.",
    property: "The Richland Riverside Suite",
  },
  {
    text: "The views from the loft were incredible. Such a unique, well-designed space.",
    name: "Michael T.",
    property: "The Kennewick Modern Loft",
  },
  {
    text: "A perfect home base for exploring wine country. Cozy, clean, and beautifully decorated.",
    name: "Rachel L.",
    property: "The Cozy Pasco Retreat",
  },
  {
    text: "We've booked through many platforms. The Parcel Company is on another level.",
    name: "David & Ana P.",
    property: "The Richland Riverside Suite",
  },
  {
    text: "From booking to checkout, everything was seamless. Already planning our next trip.",
    name: "Nicole W.",
    property: "The Spokane Craftsman Cottage",
  },
];

/* ── Single review card ── */

function ReviewCard({ quote }: { quote: GuestQuote }) {
  return (
    <div className="min-w-[300px] max-w-[360px] shrink-0 p-6 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-card)]">
      {/* Star rating */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            weight="fill"
            className="text-[var(--accent-warm)]"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="font-[family-name:var(--font-raleway)] text-sm text-[var(--text-secondary)] leading-relaxed italic">
        &ldquo;{quote.text}&rdquo;
      </p>

      {/* Attribution */}
      <div className="mt-4">
        <p className="font-[family-name:var(--font-poppins)] text-sm font-semibold text-[var(--text-primary)]">
          {quote.name}
        </p>
        <p className="font-[family-name:var(--font-raleway)] text-xs text-[var(--text-tertiary)] mt-0.5">
          Stayed at {quote.property}
        </p>
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function SocialProofStrip() {
  // Duplicate quotes for seamless infinite scroll
  const allQuotes = [...QUOTES, ...QUOTES];

  return (
    <section className="py-16 md:py-20 bg-[var(--bg)] overflow-hidden">
      {/* Section eyebrow */}
      <div className="text-center mb-10 md:mb-12 px-[var(--section-pad-x)]">
        <p className="font-[family-name:var(--font-nexa)] text-[11px] tracking-[0.25em] text-[var(--brand-bright)] uppercase">
          What Our Guests Say
        </p>
      </div>

      {/* Scrolling strip */}
      <div className="relative">
        {/* Fade masks on edges */}
        <div
          className="absolute inset-y-0 left-0 w-16 md:w-24 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to right, var(--bg), transparent)",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-16 md:w-24 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to left, var(--bg), transparent)",
          }}
        />

        {/* Scroll container */}
        <div className="flex overflow-hidden">
          <div
            className="flex gap-6 hover:[animation-play-state:paused]"
            style={{
              animation: "socialScroll 40s linear infinite",
            }}
          >
            {allQuotes.map((quote, i) => (
              <ReviewCard key={`${quote.name}-${i}`} quote={quote} />
            ))}
          </div>
        </div>
      </div>

      {/* Keyframe definition */}
      <style>{`
        @keyframes socialScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
