"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "@phosphor-icons/react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 hover:bg-[var(--surface-hover)]"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon size={18} weight="duotone" className="text-[var(--text-secondary)]" />
      ) : (
        <Sun size={18} weight="duotone" className="text-[var(--text-secondary)]" />
      )}
    </button>
  );
}
