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
            ? "bg-[var(--bg)]/90 border-b border-[var(--border)]/60 shadow-[var(--shadow-xs)]"
            : "bg-transparent border-b border-transparent"
        }
      `}
    >
      <div className="mx-auto w-full max-w-[var(--max-width)] px-[var(--section-pad-x)] flex items-center justify-between">
        {/* Logo */}
        <Logo height={32} />

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
                font-heading text-sm font-medium tracking-wide
                text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                transition-colors duration-200
                relative after:absolute after:bottom-[-2px] after:left-0
                after:h-[2px] after:w-0 after:bg-[var(--brand-bright)]
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
              font-heading text-sm font-semibold tracking-wide
              text-white bg-[var(--brand-bright)]
              shadow-[var(--shadow-brand)]
              hover:bg-[var(--brand-deep)] active:scale-[0.97]
              transition-[background-color,transform] duration-200
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

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="
              fixed inset-0 top-[var(--header-height)] z-[calc(var(--z-header)-1)]
              bg-[var(--overlay)]
            "
            onClick={() => setMobileOpen(false)}
          >
            <motion.nav
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="
                bg-[var(--bg)] border-b border-[var(--border)]
                shadow-[var(--shadow-lg)] px-[var(--section-pad-x)] py-6
              "
            >
              <ul className="flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="
                        block py-3 px-4 rounded-[var(--radius-md)]
                        font-heading text-base font-medium
                        text-[var(--text-primary)]
                        hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)]
                        transition-colors duration-200
                      "
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 pt-4 border-t border-[var(--border)]"
              >
                <Link
                  href="/properties"
                  onClick={() => setMobileOpen(false)}
                  className="
                    flex items-center justify-center w-full py-3
                    rounded-full font-heading text-base font-semibold
                    text-white bg-[var(--brand-bright)]
                    shadow-[var(--shadow-brand)]
                    hover:bg-[var(--brand-deep)] active:scale-[0.98]
                    transition-[background-color,transform] duration-200
                  "
                >
                  Book Now
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
