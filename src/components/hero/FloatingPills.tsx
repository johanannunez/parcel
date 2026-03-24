"use client";

import { useRef, useEffect, useCallback } from "react";
import { Star } from "@phosphor-icons/react";
import {
  MapPin,
  Bed,
  WifiHigh,
  Mountains,
  SwimmingPool,
  Coffee,
  Sparkle,
  Sun,
  PawPrint,
  Car,
  Fire,
  Snowflake,
  Key,
  Bathtub,
  CookingPot,
  ShieldCheck,
  Crown,
  Users,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

/* ── Color system ───────────────────────────────────────────────── */

type ColorFamily = "cyan" | "blue" | "amber";

const COLOR_CONFIG: Record<ColorFamily, {
  bg: string;
  border: string;
  shadow: string;
  glow: string;
}> = {
  cyan: {
    bg: "rgba(2,170,235,0.12)",
    border: "rgba(2,170,235,0.20)",
    shadow: "rgba(2,170,235,0.08)",
    glow: "2,170,235",
  },
  blue: {
    bg: "rgba(27,119,190,0.12)",
    border: "rgba(27,119,190,0.20)",
    shadow: "rgba(27,119,190,0.08)",
    glow: "27,119,190",
  },
  amber: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.15)",
    shadow: "rgba(245,158,11,0.06)",
    glow: "245,158,11",
  },
};

/* ── Types ──────────────────────────────────────────────────────── */

type PillElement = {
  type: "pill";
  id: string;
  icon: Icon;
  label: string;
  x: string;
  y: string;
  rotation: number;
  drift: string;
  colorFamily: ColorFamily;
};

type ReviewElement = {
  type: "review";
  id: string;
  quote: string;
  author: string;
  rating: number;
  x: string;
  y: string;
  rotation: number;
  drift: string;
  colorFamily: ColorFamily;
};

type FloatingElement = PillElement | ReviewElement;

/* ── Data: 18 pills + 12 reviews = 30 ──────────────────────────── */
// Organic scatter. No pills in bottom-center (headline + booking bar).
// Top area (y 1–44%): full width. Below 46%: edges only (x <12% or x >85%).

const ELEMENTS: FloatingElement[] = [
  // ── Band 1 (y 1–10%) ─────────────────────────────────────────
  { type: "pill",   id: "f01", icon: MapPin,      label: "Tri-Cities, WA",    x: "2%",  y: "3%",   rotation: -2,  drift: "fp-d1", colorFamily: "cyan" },
  { type: "review", id: "r01", quote: "Absolutely stunning property!",         author: "Ana",     rating: 5, x: "19%", y: "8%",   rotation: 3,   drift: "fp-d5", colorFamily: "amber" },
  { type: "pill",   id: "f02", icon: Sparkle,     label: "Superhost",          x: "42%", y: "2%",   rotation: 1,   drift: "fp-d3", colorFamily: "blue" },
  { type: "review", id: "r02", quote: "Best Airbnb we've ever booked.",        author: "Mike",    rating: 5, x: "64%", y: "9%",   rotation: -3,  drift: "fp-d7", colorFamily: "amber" },
  { type: "pill",   id: "f03", icon: Key,         label: "Self Check-in",      x: "86%", y: "4%",   rotation: 2,   drift: "fp-d2", colorFamily: "cyan" },

  // ── Band 2 (y 12–20%) ────────────────────────────────────────
  { type: "pill",   id: "f04", icon: Crown,       label: "Top Rated",          x: "6%",  y: "15%",  rotation: -3,  drift: "fp-d8", colorFamily: "blue" },
  { type: "pill",   id: "f05", icon: Bed,         label: "3 Bedrooms",         x: "28%", y: "18%",  rotation: 4,   drift: "fp-d4", colorFamily: "cyan" },
  { type: "review", id: "r03", quote: "Went above and beyond for us.",         author: "Janna",   rating: 5, x: "50%", y: "13%",  rotation: -1,  drift: "fp-d6", colorFamily: "amber" },
  { type: "pill",   id: "f06", icon: SwimmingPool, label: "Heated Pool",       x: "72%", y: "17%",  rotation: 2,   drift: "fp-d1", colorFamily: "blue" },
  { type: "review", id: "r04", quote: "Exceeded all our expectations.",        author: "Sarah",   rating: 5, x: "92%", y: "19%",  rotation: -2,  drift: "fp-d5", colorFamily: "amber" },

  // ── Band 3 (y 23–34%) ────────────────────────────────────────
  { type: "review", id: "r05", quote: "Like staying at a luxury hotel.",       author: "James",   rating: 5, x: "3%",  y: "26%",  rotation: 2,   drift: "fp-d7", colorFamily: "amber" },
  { type: "pill",   id: "f07", icon: WifiHigh,    label: "Fast WiFi",          x: "24%", y: "30%",  rotation: -4,  drift: "fp-d2", colorFamily: "cyan" },
  { type: "pill",   id: "f08", icon: Fire,        label: "Firepit",            x: "46%", y: "25%",  rotation: 1,   drift: "fp-d6", colorFamily: "blue" },
  { type: "review", id: "r06", quote: "Very clean, perfect for our group.",    author: "Kayla",   rating: 5, x: "67%", y: "32%",  rotation: -2,  drift: "fp-d3", colorFamily: "amber" },
  { type: "pill",   id: "f09", icon: Mountains,   label: "Mountain View",      x: "88%", y: "27%",  rotation: 3,   drift: "fp-d8", colorFamily: "cyan" },

  // ── Band 4 (y 36–44%) ────────────────────────────────────────
  { type: "pill",   id: "f10", icon: Bathtub,     label: "Hot Tub",            x: "8%",  y: "38%",  rotation: -1,  drift: "fp-d4", colorFamily: "blue" },
  { type: "review", id: "r07", quote: "Incredible attention to detail.",       author: "Rachel",  rating: 5, x: "31%", y: "42%",  rotation: 3,   drift: "fp-d1", colorFamily: "amber" },
  { type: "pill",   id: "f11", icon: Users,       label: "Sleeps 8",           x: "54%", y: "37%",  rotation: -3,  drift: "fp-d5", colorFamily: "cyan" },
  { type: "pill",   id: "f12", icon: Snowflake,   label: "Air Conditioning",   x: "76%", y: "43%",  rotation: 2,   drift: "fp-d7", colorFamily: "blue" },
  { type: "review", id: "r08", quote: "Five stars is not enough!",            author: "Carlos",  rating: 5, x: "93%", y: "39%",  rotation: -2,  drift: "fp-d3", colorFamily: "amber" },

  // ── Left gutter (y 48–88%, x 0–12%) ──────────────────────────
  { type: "pill",   id: "f13", icon: PawPrint,    label: "Pet Friendly",       x: "2%",  y: "50%",  rotation: 3,   drift: "fp-d6", colorFamily: "cyan" },
  { type: "review", id: "r09", quote: "The pool was absolutely amazing!",      author: "Nicole",  rating: 5, x: "9%",  y: "60%",  rotation: -2,  drift: "fp-d2", colorFamily: "amber" },
  { type: "pill",   id: "f14", icon: CookingPot,  label: "Full Kitchen",       x: "3%",  y: "70%",  rotation: 1,   drift: "fp-d8", colorFamily: "blue" },
  { type: "review", id: "r10", quote: "We'll be back every summer.",           author: "Anna",    rating: 5, x: "7%",  y: "80%",  rotation: -3,  drift: "fp-d4", colorFamily: "amber" },
  { type: "pill",   id: "f15", icon: Coffee,      label: "Coffee Bar",         x: "1%",  y: "88%",  rotation: 2,   drift: "fp-d1", colorFamily: "cyan" },

  // ── Right gutter (y 48–88%, x 85–97%) ────────────────────────
  { type: "pill",   id: "f16", icon: Car,         label: "Free Parking",       x: "87%", y: "52%",  rotation: -2,  drift: "fp-d5", colorFamily: "blue" },
  { type: "review", id: "r11", quote: "A great home away from home.",          author: "Brandon", rating: 5, x: "93%", y: "62%",  rotation: 3,   drift: "fp-d7", colorFamily: "amber" },
  { type: "pill",   id: "f17", icon: Sun,         label: "Sunny Patio",        x: "86%", y: "72%",  rotation: -1,  drift: "fp-d3", colorFamily: "cyan" },
  { type: "review", id: "r12", quote: "So much better than any hotel.",        author: "Ryan",    rating: 5, x: "95%", y: "82%",  rotation: 2,   drift: "fp-d6", colorFamily: "amber" },
  { type: "pill",   id: "f18", icon: ShieldCheck, label: "Contactless",        x: "88%", y: "90%",  rotation: -3,  drift: "fp-d8", colorFamily: "blue" },
];

/* ── Interaction constants ──────────────────────────────────────── */

const DORMANT_OPACITY = 0.45;
const ACTIVE_OPACITY = 0.92;
const DORMANT_BLUR = 6;
const REVEAL_MAX_DIST = 380;
const REVEAL_MIN_DIST = 40;

/* ── Component ──────────────────────────────────────────────────── */

export default function FloatingPills() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLElement | null)[]>([]);
  const rafRef = useRef<number>(0);

  const applyDormant = useCallback((el: HTMLElement) => {
    el.style.opacity = String(DORMANT_OPACITY);
    el.style.filter = `blur(${DORMANT_BLUR}px)`;
  }, []);

  const updateProximity = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    ELEMENTS.forEach((el, i) => {
      const node = itemEls.current[i];
      if (!node) return;
      const elRect = node.getBoundingClientRect();
      const cx = elRect.left - rect.left + elRect.width / 2;
      const cy = elRect.top - rect.top + elRect.height / 2;
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);

      if (dist >= REVEAL_MAX_DIST) {
        applyDormant(node);
        return;
      }

      const t = Math.max(0, 1 - (dist - REVEAL_MIN_DIST) / (REVEAL_MAX_DIST - REVEAL_MIN_DIST));
      const opacity = DORMANT_OPACITY + (ACTIVE_OPACITY - DORMANT_OPACITY) * t;
      const blur = DORMANT_BLUR * (1 - t);
      const glowRGB = COLOR_CONFIG[el.colorFamily].glow;
      const glowSpread = 12 * t;
      const glowAlpha = 0.35 * t;

      node.style.opacity = String(opacity);
      node.style.filter = `blur(${blur.toFixed(1)}px) drop-shadow(0 0 ${glowSpread.toFixed(1)}px rgba(${glowRGB},${glowAlpha.toFixed(2)}))`;
    });
  }, [applyDormant]);

  const resetAll = useCallback(() => {
    ELEMENTS.forEach((_, i) => {
      const el = itemEls.current[i];
      if (el) applyDormant(el);
    });
  }, [applyDormant]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => updateProximity(e.clientX, e.clientY));
    };
    const onLeave = () => {
      cancelAnimationFrame(rafRef.current);
      resetAll();
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateProximity, resetAll]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none z-[1] hidden md:block"
    >
      {ELEMENTS.map((el, i) => (
        <div
          key={el.id}
          ref={(node) => { itemEls.current[i] = node; }}
          className={`${
            el.type === "pill"
              ? `fp-pill fp-pill-${el.colorFamily}`
              : "fp-review"
          } ${el.drift}`}
          style={{
            position: "absolute",
            left: el.x,
            top: el.y,
            transform: `rotate(${el.rotation}deg)`,
            opacity: DORMANT_OPACITY,
            filter: `blur(${DORMANT_BLUR}px)`,
            transition: "opacity 0.3s ease-out, filter 0.3s ease-out",
          }}
        >
          {el.type === "pill" ? (
            <>
              <el.icon size={16} weight="bold" />
              <span>{el.label}</span>
            </>
          ) : (
            <>
              <div className="fp-stars">
                {Array.from({ length: el.rating }).map((_, j) => (
                  <Star key={j} size={11} weight="fill" className="fp-star-icon" />
                ))}
              </div>
              <p className="fp-quote">&ldquo;{el.quote}&rdquo;</p>
              <span className="fp-author">{el.author}</span>
            </>
          )}
        </div>
      ))}

      <style>{`
        /* ── Feature pill (base) ──────────────────────── */
        .fp-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 100px;
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          color: rgba(255,255,255,0.95);
          font-size: 13px; font-weight: 600; white-space: nowrap;
        }

        /* ── Pill color variants ──────────────────────── */
        .fp-pill-cyan {
          background: ${COLOR_CONFIG.cyan.bg};
          border: 1px solid ${COLOR_CONFIG.cyan.border};
          box-shadow: 0 4px 20px ${COLOR_CONFIG.cyan.shadow};
        }
        .fp-pill-blue {
          background: ${COLOR_CONFIG.blue.bg};
          border: 1px solid ${COLOR_CONFIG.blue.border};
          box-shadow: 0 4px 20px ${COLOR_CONFIG.blue.shadow};
        }

        /* ── Review card (amber) ──────────────────────── */
        .fp-review {
          max-width: 210px; padding: 14px 18px; border-radius: 14px;
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          background: ${COLOR_CONFIG.amber.bg};
          border: 1px solid ${COLOR_CONFIG.amber.border};
          box-shadow: 0 4px 20px ${COLOR_CONFIG.amber.shadow};
        }
        .fp-stars { display: flex; gap: 2px; margin-bottom: 6px; }
        .fp-star-icon { color: #f59e0b; }
        .fp-quote {
          color: rgba(255,255,255,0.92);
          font-size: 12.5px; line-height: 1.5;
          font-weight: 500;
        }
        .fp-author {
          display: block; margin-top: 6px;
          color: rgba(255,255,255,0.55);
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* ── Drift animations ─────────────────────────── */
        @keyframes fp-d1 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(18px,10px) rotate(1.5deg)} 66%{transform:translate(-10px,18px) rotate(-1deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d2 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(-14px,-12px) rotate(-2deg)} 66%{transform:translate(12px,-6px) rotate(1deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d3 { 0%{transform:translate(0,0)} 50%{transform:translate(14px,-10px)} 100%{transform:translate(0,0)} }
        @keyframes fp-d4 { 0%{transform:translate(0,0) rotate(0deg)} 40%{transform:translate(-8px,14px) rotate(1deg)} 80%{transform:translate(10px,6px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d5 { 0%{transform:translate(0,0)} 35%{transform:translate(12px,-8px)} 70%{transform:translate(-6px,-14px)} 100%{transform:translate(0,0)} }
        @keyframes fp-d6 { 0%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-16px,8px) rotate(2deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d7 { 0%{transform:translate(0,0) rotate(0deg)} 25%{transform:translate(10px,-14px) rotate(-1.5deg)} 50%{transform:translate(-6px,-8px) rotate(0.5deg)} 75%{transform:translate(14px,6px) rotate(1deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d8 { 0%{transform:translate(0,0)} 40%{transform:translate(-12px,10px)} 70%{transform:translate(8px,-12px)} 100%{transform:translate(0,0)} }

        .fp-d1{animation:fp-d1 22s ease-in-out infinite}
        .fp-d2{animation:fp-d2 18s ease-in-out infinite}
        .fp-d3{animation:fp-d3 25s ease-in-out infinite}
        .fp-d4{animation:fp-d4 20s ease-in-out infinite}
        .fp-d5{animation:fp-d5 16s ease-in-out infinite}
        .fp-d6{animation:fp-d6 24s ease-in-out infinite}
        .fp-d7{animation:fp-d7 28s ease-in-out infinite}
        .fp-d8{animation:fp-d8 21s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.fp-d1,.fp-d2,.fp-d3,.fp-d4,.fp-d5,.fp-d6,.fp-d7,.fp-d8{animation:none}}
      `}</style>
    </div>
  );
}
