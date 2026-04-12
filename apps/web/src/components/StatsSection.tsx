"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

const STATS = [
  { value: "10+", label: "Properties" },
  { value: "500+", label: "Guests hosted" },
  { value: "5+", label: "Cities" },
  { value: "4.9", label: "Avg. rating" },
];

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section aria-label="Statistics" className="bg-surface py-20 md:py-24">
      <div
        ref={ref}
        className="mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="text-label text-brand"
        >
          By the numbers
        </motion.p>

        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={
                inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <p className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
