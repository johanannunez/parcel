"use client";

import { motion } from "motion/react";
import {
  MagnifyingGlass,
  MapPin,
  CalendarBlank,
  Users,
} from "@phosphor-icons/react";
import FloatingPills from "@/components/hero/FloatingPills";
import FloatingBokeh from "@/components/hero/FloatingBokeh";

export default function HeroBookingBar() {
  return (
    <section className="relative flex min-h-screen items-end justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80&auto=format')",
          }}
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Floating elements */}
      <FloatingBokeh />
      <FloatingPills />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 pb-16 pt-48 md:px-12 md:pb-24 lg:px-16">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-14"
        >
          <h1 className="text-hero max-w-2xl text-white">
            Stay somewhere
            <br />
            worth remembering
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/80 md:text-xl">
            Vacation homes and furnished residences, handpicked for people who
            notice the details.
          </p>
        </motion.div>

        {/* Booking Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="frosted w-full rounded-[var(--radius-lg)] p-2 shadow-xl md:p-3"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
            {/* Location */}
            <div className="group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60 md:border-r md:border-warm-gray-200">
              <MapPin
                size={20}
                weight="bold"
                className="shrink-0 text-brand"
              />
              <div className="flex-1">
                <label className="text-label text-text-tertiary">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Where to?"
                  className="mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Check In */}
            <div className="group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60 md:border-r md:border-warm-gray-200">
              <CalendarBlank
                size={20}
                weight="bold"
                className="shrink-0 text-brand"
              />
              <div className="flex-1">
                <label className="text-label text-text-tertiary">
                  Check in
                </label>
                <input
                  type="text"
                  placeholder="Add date"
                  className="mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Check Out */}
            <div className="group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60 md:border-r md:border-warm-gray-200">
              <CalendarBlank
                size={20}
                weight="bold"
                className="shrink-0 text-brand"
              />
              <div className="flex-1">
                <label className="text-label text-text-tertiary">
                  Check out
                </label>
                <input
                  type="text"
                  placeholder="Add date"
                  className="mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60">
              <Users
                size={20}
                weight="bold"
                className="shrink-0 text-brand"
              />
              <div className="flex-1">
                <label className="text-label text-text-tertiary">Guests</label>
                <input
                  type="text"
                  placeholder="Add guests"
                  className="mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Search Button */}
            <button className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-r from-brand-light to-brand px-6 py-4 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:ml-2 md:px-8">
              <MagnifyingGlass size={18} weight="bold" />
              <span>Search</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
