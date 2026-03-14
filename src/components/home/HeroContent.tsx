"use client";

import { motion } from "motion/react";
import Button from "@/components/ui/Button";

const TRUST_ITEMS = [
  "9 Curated Homes",
  "5 Washington Cities",
  "Direct Booking Saves 10%",
  "24/7 Guest Support",
];

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: EASE },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { duration: 0.8, delay, ease: EASE },
  }),
};

export default function HeroContent() {
  return (
    <>
      {/* Text content */}
      <div className="relative z-10 flex flex-col items-center text-center px-[var(--section-pad-x)] max-w-3xl mx-auto">
        {/* Eyebrow */}
        <motion.p
          className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-white/80 mb-4 font-[family-name:var(--font-heading)]"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          PREMIUM VACATION RENTALS IN WASHINGTON
        </motion.p>

        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight font-[family-name:var(--font-heading)]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
        >
          Your next getaway starts here.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-5 text-base sm:text-lg md:text-xl text-white/85 max-w-xl leading-relaxed font-[family-name:var(--font-body)]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.6}
        >
          Curated homes across Washington state. Book direct and save 10%.
        </motion.p>

        {/* CTA row */}
        <motion.div
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.8}
        >
          <Button variant="primary" size="lg" href="/properties">
            Explore Properties
          </Button>
          <Button
            variant="ghost"
            size="lg"
            href="#featured"
            className="text-white/90 hover:bg-white/10 border border-white/30 hover:border-white/50"
          >
            Learn More
          </Button>
        </motion.div>
      </div>

      {/* Trust bar */}
      <motion.div
        className="relative z-10 mt-auto w-full"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={1.0}
      >
        <div className="max-w-5xl mx-auto px-[var(--section-pad-x)]">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-6 border-t border-white/15">
            {TRUST_ITEMS.map((item, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm text-white/70 tracking-wide font-[family-name:var(--font-body)] whitespace-nowrap"
              >
                {item}
                {i < TRUST_ITEMS.length - 1 && (
                  <span className="ml-6 hidden sm:inline text-white/30">
                    &middot;
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
