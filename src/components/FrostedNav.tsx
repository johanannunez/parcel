"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { List, X, Sun, Moon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "./ThemeProvider";

const NAV_LINKS = [
  { label: "Properties", href: "#properties" },
  { label: "About", href: "#about" },
  { label: "Journal", href: "#journal" },
  { label: "Contact", href: "#contact" },
];

export default function FrostedNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        aria-label="Main navigation"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "frosted border-b border-warm-gray-200/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-12 lg:px-16">
          {/* Logo */}
          <Link href="/" className="relative z-10 flex items-center gap-2">
            <Image
              src={scrolled && theme === "light" ? "/brand/logo-mark.png" : "/brand/logo-mark-white.png"}
              alt="The Parcel Company"
              width={48}
              height={48}
              className="h-9 w-auto transition-opacity duration-300"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-300 hover:text-brand ${
                  scrolled ? "text-text-primary" : "text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 ${
                scrolled
                  ? "text-text-primary hover:bg-warm-gray-100"
                  : "text-white hover:bg-white/10"
              }`}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon size={20} weight="bold" />
              ) : (
                <Sun size={20} weight="bold" />
              )}
            </button>
            <Link
              href="#properties"
              className="rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light to-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Search
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300 ${
                scrolled
                  ? "text-text-primary hover:bg-warm-gray-100"
                  : "text-white hover:bg-white/10"
              }`}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon size={20} weight="bold" />
              ) : (
                <Sun size={20} weight="bold" />
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full ${
                scrolled ? "text-text-primary" : "text-white"
              }`}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="frosted fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold text-text-primary transition-colors duration-300 hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#properties"
              onClick={() => setMobileOpen(false)}
              className="mt-4 rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light to-brand px-8 py-3 text-base font-semibold text-white"
            >
              Search Properties
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
