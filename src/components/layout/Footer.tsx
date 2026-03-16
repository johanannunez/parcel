"use client";

import Link from "next/link";
import {
  InstagramLogo,
  FacebookLogo,
  XLogo,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import Logo from "@/components/layout/Logo";

const footerColumns = [
  {
    title: "Stay",
    links: [
      { label: "Properties", href: "/properties" },
      { label: "Reviews", href: "/reviews" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Management", href: "/management" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", icon: InstagramLogo },
  { label: "Facebook", href: "https://facebook.com", icon: FacebookLogo },
  { label: "X", href: "https://x.com", icon: XLogo },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1815] text-[#A8A298] relative overflow-hidden border-t border-white/[0.06]">
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--section-pad-x)]">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-12 pt-16 pb-12 md:grid-cols-12 md:gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="md:col-span-4 lg:col-span-4">
            <Logo height={30} variant="white" />
            <p className="mt-4 text-sm font-[family-name:var(--font-raleway)] leading-relaxed text-[#9A9590] max-w-[280px]">
              Premium Vacation Rentals across Washington state. Book direct and
              save 10% on every stay.
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="
                    flex items-center justify-center w-9 h-9
                    rounded-full bg-white/[0.06] text-[#9A9590]
                    hover:bg-brand-bright hover:text-white
                    transition-[background-color,color] duration-200
                    focus-visible:outline-2 focus-visible:outline-offset-2
                    focus-visible:outline-brand-bright
                  "
                >
                  <social.icon size={18} weight="regular" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-8 lg:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="font-[family-name:var(--font-poppins)] text-xs font-semibold uppercase tracking-[0.12em] text-[#F0EDE8] mb-4">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="
                          text-sm font-[family-name:var(--font-raleway)] text-[#9A9590] hover:text-white
                          transition-colors duration-200
                        "
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/[0.06] py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-[family-name:var(--font-poppins)] text-sm font-semibold text-[#F0EDE8]">
                Stay in the loop
              </h4>
              <p className="mt-1 text-xs font-[family-name:var(--font-raleway)] text-[#9A9590]">
                New properties, exclusive deals, and travel tips.
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full max-w-sm"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="you@email.com"
                className="
                  flex-1 min-w-0 px-4 py-2.5 rounded-l-full
                  bg-white/[0.06] border border-white/[0.08] border-r-0
                  text-sm font-[family-name:var(--font-raleway)] text-[#F0EDE8] placeholder:text-[#706B62]
                  focus:outline-none focus:border-brand-bright/40 focus:bg-white/[0.08]
                  transition-[border-color,background-color] duration-200
                "
              />
              <button
                type="submit"
                className="
                  inline-flex items-center gap-2 px-5 py-2.5
                  rounded-r-full bg-[image:var(--brand-gradient)] text-sm font-semibold
                  font-[family-name:var(--font-poppins)] text-white
                  hover:bg-[image:var(--brand-gradient-hover)] active:scale-[0.97]
                  transition-transform duration-200
                  focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-brand-bright
                "
              >
                <PaperPlaneTilt size={16} weight="bold" />
                <span className="hidden sm:inline">Subscribe</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] py-6">
          <div className="flex flex-col gap-3 text-xs font-[family-name:var(--font-raleway)] text-[#706B62] sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {currentYear} The Parcel Company. All rights reserved.
            </p>
            <p className="text-[10px] leading-relaxed sm:text-xs">
              Pasco, WA &middot; Kennewick &middot; Spokane &middot; Richland &middot; Vancouver
            </p>
            <Link
              href="/llm/home"
              className="text-[#706B62] hover:text-[#9A9590] transition-colors duration-200"
            >
              View as text
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
