# Dark Mode System

**Date:** 2026-04-09
**Status:** Approved
**Scope:** Entire site (marketing, portal, admin content)

## Summary

Full dark/light mode system for theparcelco.com. True neutral grays (no blue tint, no warm tint). Brand blue stays identical in both modes. User preference persisted to localStorage, falls back to system `prefers-color-scheme`. No flash on load.

## Dark Palette

All values are pure neutral grays. No color tint in any direction.

| Token | Light | Dark |
|---|---|---|
| `--color-white` | `#ffffff` | `#141414` |
| `--color-off-white` | `#fafafa` | `#1a1a1a` |
| `--color-warm-gray-50` | `#f8f7f6` | `#222222` |
| `--color-warm-gray-100` | `#f0eeec` | `#2a2a2a` |
| `--color-warm-gray-200` | `#e2dfdc` | `#3a3a3a` |
| `--color-warm-gray-400` | `#767170` | `#8a8a8a` |
| `--color-text-primary` | `#1a1a1a` | `#ececec` |
| `--color-text-secondary` | `#6b7280` | `#a0a0a0` |
| `--color-text-tertiary` | `#767170` | `#787878` |
| `--color-brand` | `#1b77be` | `#1b77be` (unchanged) |
| `--color-brand-light` | `#02aaeb` | `#02aaeb` (unchanged) |
| `--color-brand-gradient` | `linear-gradient(135deg, #02aaeb, #1b77be)` | same (unchanged) |
| `--color-navy` | `#0f172a` | `#0a0a0a` |
| `--color-charcoal` | `#1e293b` | `#111111` |
| `--color-success` | `#16a34a` | `#22c55e` (slightly brighter for contrast) |
| `--color-error` | `#dc2626` | `#ef4444` (slightly brighter for contrast) |
| `--color-star` | `#f59e0b` | `#f59e0b` (unchanged) |

### Shadows (dark mode)

Stronger opacity since dark surfaces need more pronounced shadows to create depth:

| Token | Dark value |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.3)` |
| `--shadow-md` | `0 4px 12px rgba(0, 0, 0, 0.4)` |
| `--shadow-lg` | `0 8px 30px rgba(0, 0, 0, 0.5)` |
| `--shadow-xl` | `0 16px 48px rgba(0, 0, 0, 0.6)` |
| `--shadow-card` | `0 2px 8px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.4)` |

### Frosted glass (dark mode)

```css
:root.dark .frosted {
  background: rgba(20, 20, 20, 0.8);
}
```

### Selection (dark mode)

```css
:root.dark ::selection {
  background: rgba(2, 170, 235, 0.25);
}
```

## Architecture

### 1. ThemeProvider (`apps/web/src/components/ThemeProvider.tsx`)

Client component wrapping the entire app in `layout.tsx`. Provides React context with:

- `theme: "light" | "dark" | "system"` -- the user's explicit choice
- `resolvedTheme: "light" | "dark"` -- the actual applied theme after resolving "system"
- `setTheme(theme: "light" | "dark" | "system"): void`

**Behavior:**
- On mount, reads `localStorage.getItem("parcel-theme")`. If null, defaults to `"system"`.
- `"system"` resolves via `window.matchMedia("(prefers-color-scheme: dark)")`. Listens for changes.
- Applies or removes `dark` class on `document.documentElement`.
- Persists explicit choice to `localStorage` under key `"parcel-theme"`.

### 2. Flash prevention script

Inline `<script>` in `apps/web/src/app/layout.tsx` inside `<head>`, before any CSS or React hydration:

```js
(function(){
  try {
    var t = localStorage.getItem("parcel-theme");
    var d = t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (d) document.documentElement.classList.add("dark");
  } catch(e) {}
})();
```

This runs synchronously before paint, preventing white flash.

### 3. Sidebar toggle wiring

`SidebarFooter.tsx` changes:
- Import `useTheme` from the ThemeProvider
- Remove `useState` for toast, remove `handleThemeToggle` toast logic
- Toggle calls `setTheme(resolvedTheme === "dark" ? "light" : "dark")`
- Shows Moon icon + "Dark mode" when currently light (meaning: click to go dark)
- Shows Sun icon + "Light mode" when currently dark (meaning: click to go light)

### 4. Hardcoded color remediation

~109 instances across ~40 files need to be converted from hardcoded hex/Tailwind colors to CSS var references. Categories:

**Inline style hex codes (~53 instances, 20 files):**
- Replace `color: "#1a1a1a"` with `color: "var(--color-text-primary)"`
- Replace `backgroundColor: "#fff"` with `backgroundColor: "var(--color-white)"`
- Map each hardcoded value to its closest CSS var equivalent

**Tailwind hardcoded classes (~56 instances, 20 files):**
- Replace `bg-white` with `bg-[var(--color-white)]` or use the Tailwind theme alias
- Replace `text-white` with appropriate var-based class
- Replace `text-gray-*`, `bg-gray-*`, `border-gray-*` with var equivalents

**Files with the most hardcoded colors (priority order):**
1. `setup/page.tsx` (15 inline hex instances)
2. `RevenueCalculator.tsx` (9 Tailwind instances)
3. `AdminMessagesShell.tsx` (9 Tailwind instances)
4. `block-requests/BlockRequestRow.tsx` (7+1 instances)
5. Login/Signup/Reset forms (3-4 each)

### 5. Admin sidebar

The admin sidebar (`AdminSidebar.tsx`) is intentionally dark in both modes. It keeps its own hardcoded dark styling and does not respond to the theme toggle. The admin content area does respond to the theme.

## Scope

**In scope:**
- globals.css dark palette (replace existing `:root.dark` block)
- ThemeProvider component + context hook
- Flash prevention inline script
- Sidebar toggle wiring (remove "Coming soon", add real toggle)
- Hardcoded color remediation across all ~40 affected files
- Marketing pages (homepage, free-tips, login, signup, forgot/reset password)
- Standalone pages (about, blog, careers, contact, help, terms, privacy, etc.)
- Portal pages (dashboard, properties, calendar, payouts, setup, messages, onboarding)
- Admin content area
- Frosted glass, selection highlight dark variants
- Marketing navbar and footer dark mode

**Out of scope:**
- Admin sidebar theme switching (stays dark always)
- Per-page theme overrides
- Auto-switching based on time of day
- Theme transition animations beyond the existing 0.3s on body
- Mobile sidebar (separate future work)
