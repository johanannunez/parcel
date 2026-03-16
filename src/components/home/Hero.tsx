"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import Button from "@/components/ui/Button";
import { properties } from "@/content/properties";

const EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE_INTERVAL = 6000;

const SLIDES = properties.slice(0, 5).map((p) => ({
  src: p.photos[0],
  alt: `${p.title} in ${p.location.city}, ${p.location.state}`,
}));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: EASE },
  }),
};

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollY } = useScroll();
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const contentY = useTransform(scrollY, [0, 500], [0, 60]);

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background carousel */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.2, ease: EASE }, scale: { duration: 6, ease: EASE } }}
        >
          <Image
            src={SLIDES[activeIndex].src}
            alt={SLIDES[activeIndex].alt}
            fill
            priority={activeIndex === 0}
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-[var(--section-pad-x)]"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-white tracking-[-0.03em] leading-[1.08] font-[family-name:var(--font-poppins)]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
        >
          Your next getaway starts here.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-6 text-lg md:text-xl text-white/90 leading-relaxed font-[family-name:var(--font-raleway)]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.6}
        >
          Curated homes across Washington state. Book direct and save 10%.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="mt-8"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.9}
        >
          <Button
            variant="primary"
            size="lg"
            href="/properties"
            className="rounded-full shadow-[var(--shadow-glow-brand)] hover:shadow-[0_0_32px_rgba(2,170,235,0.30),0_0_64px_rgba(2,170,235,0.12)]"
          >
            Explore Properties
          </Button>
        </motion.div>
      </motion.div>

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="group p-1 cursor-pointer"
          >
            <span
              className={[
                "block rounded-full transition-[background-color,width] duration-300 ease-out h-2",
                i === activeIndex ? "w-6 bg-white" : "w-2 bg-white/40 group-hover:bg-white/60",
              ].join(" ")}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
