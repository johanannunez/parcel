"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "@/components/layout/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navLinks = [
  { label: "Properties", href: "/properties" },
  { label: "About", href: "/about" },
  { label: "Management", href: "/management" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-[var(--z-header)]
        h-[var(--header-height)] flex items-center
        backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300
        ${
          scrolled
            ? "border-b border-[var(--border)]/60 shadow-[var(--shadow-xs)]"
            : "border-b border-transparent"
        }
      `}
      style={{
        backgroundColor: scrolled
          ? "var(--header-glass-scrolled)"
          : "var(--header-glass)",
      }}
    >
      <div className="mx-auto w-full max-w-[var(--max-width)] px-[var(--section-pad-x)] flex items-center justify-between">
        {/* Logo with scroll-aware sizing */}
        <div
          className="transition-transform duration-300 ease-out origin-left"
          style={{ transform: `scale(${scrolled ? 28 / 36 : 1})` }}
        >
          <Logo height={36} />
        </div>

        {/* Desktop nav */}
        <nav
          data-desktop-nav
          className="hidden md:flex items-center gap-8"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="
                font-[family-name:var(--font-raleway)] text-sm font-medium
                text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                transition-colors duration-200
                relative after:absolute after:bottom-[-2px] after:left-0
                after:h-[2.5px] after:w-0 after:rounded-full
                after:bg-[image:var(--brand-gradient)]
                after:transition-[width] after:duration-300
                hover:after:w-full
              "
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right actions */}
        <div
          data-desktop-nav
          className="hidden md:flex items-center gap-3"
        >
          <ThemeToggle />
          <Link
            href="/properties"
            className="
              inline-flex items-center px-5 py-2 rounded-full
              font-[family-name:var(--font-poppins)] text-sm font-semibold
              text-white bg-[var(--brand-bright)]
              shadow-[var(--shadow-brand)]
              hover:shadow-[var(--shadow-glow-brand)] active:scale-[0.97]
              transition-[transform,box-shadow] duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-[var(--brand-bright)]
            "
          >
            Book Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div data-hamburger className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="
              flex items-center justify-center w-10 h-10
              rounded-[var(--radius-md)] transition-colors duration-200
              hover:bg-[var(--surface-hover)]
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-[var(--brand-bright)]
            "
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={22} weight="bold" className="text-[var(--text-primary)]" />
            ) : (
              <List size={22} weight="bold" className="text-[var(--text-primary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="
              fixed inset-0 top-[var(--header-height)] z-[calc(var(--z-header)-1)]
              backdrop-blur-xl bg-[var(--bg)]/95
            "
          >
            <nav
              className="flex flex-col items-center justify-center h-full px-[var(--section-pad-x)]"
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="flex flex-col items-center gap-6">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      delay: 0.06 * i,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1] as const,
                    }}
                    className="flex flex-col items-center"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="
                        text-2xl font-[family-name:var(--font-poppins)] font-bold
                        text-[var(--text-primary)]
                        hover:text-[var(--brand-bright)]
                        transition-colors duration-200
                      "
                    >
                      {link.label}
                    </Link>
                    {/* Brand gradient accent line */}
                    <div
                      className="mt-2 h-[2px] w-10 rounded-full bg-[image:var(--brand-gradient)] opacity-30"
                      aria-hidden="true"
                    />
                  </motion.li>
                ))}
              </ul>

              {/* Book Now CTA at bottom of centered stack */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  delay: 0.06 * navLinks.length,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1] as const,
                }}
                className="mt-10 w-full max-w-xs"
              >
                <Link
                  href="/properties"
                  onClick={() => setMobileOpen(false)}
                  className="
                    flex items-center justify-center w-full py-3.5
                    rounded-full font-[family-name:var(--font-poppins)] text-base font-semibold
                    text-white bg-[var(--brand-bright)]
                    shadow-[var(--shadow-brand)]
                    hover:shadow-[var(--shadow-glow-brand)] active:scale-[0.98]
                    transition-[transform,box-shadow] duration-200
                  "
                >
                  Book Now
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
