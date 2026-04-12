import Link from "next/link";
import {
  House,
  Wallet,
  CalendarBlank,
  Gear,
  ShieldCheck,
  Question,
  Lifebuoy,
  Notebook,
  Buildings,
  ChartLineUp,
  UserCircle,
  Bell,
  ClipboardText,
  HandCoins,
  Key,
  Megaphone,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

function renderIcon(name: string, size: number): ReactNode {
  const icons: Record<string, ReactNode> = {
    House: <House size={size} weight="duotone" />,
    Wallet: <Wallet size={size} weight="duotone" />,
    CalendarBlank: <CalendarBlank size={size} weight="duotone" />,
    Gear: <Gear size={size} weight="duotone" />,
    ShieldCheck: <ShieldCheck size={size} weight="duotone" />,
    Question: <Question size={size} weight="duotone" />,
    Lifebuoy: <Lifebuoy size={size} weight="duotone" />,
    Notebook: <Notebook size={size} weight="duotone" />,
    Buildings: <Buildings size={size} weight="duotone" />,
    ChartLineUp: <ChartLineUp size={size} weight="duotone" />,
    UserCircle: <UserCircle size={size} weight="duotone" />,
    Bell: <Bell size={size} weight="duotone" />,
    ClipboardText: <ClipboardText size={size} weight="duotone" />,
    HandCoins: <HandCoins size={size} weight="duotone" />,
    Key: <Key size={size} weight="duotone" />,
    Megaphone: <Megaphone size={size} weight="duotone" />,
  };
  return icons[name] ?? <Question size={size} weight="duotone" />;
}

export function CategoryCard({
  name,
  slug,
  description,
  icon,
  articleCount,
}: {
  name: string;
  slug: string;
  description: string;
  icon: string;
  articleCount: number;
}) {
  return (
    <Link
      href={`/help/${slug}`}
      className="group relative flex flex-col gap-4 rounded-2xl border p-6 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] active:translate-y-0"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Hover shadow layer (separate from transform for GPU compositing) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          boxShadow:
            "0 16px 36px -12px rgba(2, 170, 235, 0.10), 0 6px 12px -4px rgba(0, 0, 0, 0.06)",
        }}
      />

      <span
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "rgba(2, 170, 235, 0.08)",
          color: "var(--color-brand)",
        }}
      >
        {renderIcon(icon, 22)}
      </span>

      <div className="relative min-w-0">
        <h3
          className="text-[15px] font-semibold leading-snug tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {name}
        </h3>
        <p
          className="mt-1.5 line-clamp-2 text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>
      </div>

      <span
        className="relative mt-auto text-xs font-medium"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {articleCount} {articleCount === 1 ? "article" : "articles"}
      </span>
    </Link>
  );
}
