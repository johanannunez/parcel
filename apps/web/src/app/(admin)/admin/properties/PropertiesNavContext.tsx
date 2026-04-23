"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePropertiesMode } from "./PropertiesModeContext";
import { PropertiesSkeleton } from "./PropertiesSkeletons";
import type { HomesMode } from "./homes-types";

export type Dest = "launchpad" | "kanban" | "gallery" | "table";

type Ctx = {
  navigateTo: (dest: Dest) => void;
  pendingDest: Dest | null;
};

const PropertiesNavContext = createContext<Ctx | null>(null);

/**
 * Owns the "are we navigating to a different route?" state for the whole
 * properties section. Gallery ↔ Table is the instant path (same component,
 * no route swap). Going to/from Launchpad or Kanban is a real route swap,
 * so we kick it through useTransition and render a skeleton until React
 * finishes rendering the new page.
 */
export function PropertiesNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setMode } = usePropertiesMode();

  const view = searchParams?.get("view") ?? "";
  const modeParam = searchParams?.get("mode") ?? "";
  const onLaunchpadView = view === "launchpad";
  const onKanbanView = modeParam === "status";

  const [isPending, startTransition] = useTransition();
  const [pendingDest, setPendingDest] = useState<Dest | null>(null);

  useEffect(() => {
    if (!isPending) setPendingDest(null);
  }, [isPending]);

  const navigateTo = useCallback(
    (dest: Dest) => {
      const goingToLaunchpad = dest === "launchpad";
      const goingToKanban = dest === "kanban";
      const needsRouteSwap =
        onLaunchpadView || onKanbanView || goingToLaunchpad || goingToKanban;

      if (!needsRouteSwap) {
        // Gallery ↔ Table: instant, no skeleton, no delay.
        setMode(dest as HomesMode);
        const url = new URL(window.location.href);
        url.searchParams.set("view", "details");
        url.searchParams.set("mode", dest);
        window.history.replaceState(
          null,
          "",
          `${url.pathname}?${url.searchParams.toString()}`,
        );
        return;
      }

      if (!goingToLaunchpad && !goingToKanban) {
        setMode(dest as HomesMode);
      }
      setPendingDest(dest);
      startTransition(() => {
        if (goingToLaunchpad) {
          router.push("/admin/properties?view=launchpad", { scroll: false });
        } else if (goingToKanban) {
          router.push("/admin/properties?mode=status", { scroll: false });
        } else {
          router.push(
            `/admin/properties?view=details&mode=${dest}`,
            { scroll: false },
          );
        }
      });
    },
    [onLaunchpadView, onKanbanView, router, setMode],
  );

  const value = useMemo<Ctx>(
    () => ({
      navigateTo,
      pendingDest: isPending ? pendingDest : null,
    }),
    [navigateTo, isPending, pendingDest],
  );

  return (
    <PropertiesNavContext.Provider value={value}>
      {children}
    </PropertiesNavContext.Provider>
  );
}

export function usePropertiesNav(): Ctx {
  const ctx = useContext(PropertiesNavContext);
  if (!ctx) {
    return { navigateTo: () => {}, pendingDest: null };
  }
  return ctx;
}

/**
 * Swaps children for a destination-shaped skeleton while navigation is in
 * flight. Mounted inside PropertiesLayoutClient just under the nav
 * provider so the admin top bar chrome stays live during the transition.
 */
export function PropertiesContent({ children }: { children: ReactNode }) {
  const { pendingDest } = usePropertiesNav();
  if (pendingDest) return <PropertiesSkeleton dest={pendingDest} />;
  return <>{children}</>;
}
