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

type Dest = "status" | "gallery" | "table";

type Ctx = {
  navigateTo: (dest: Dest) => void;
  pendingDest: Dest | null;
};

const PropertiesNavContext = createContext<Ctx | null>(null);

/**
 * Owns the "are we navigating to a different route?" state for the whole
 * properties section. Gallery ↔ Table is the instant path (same component,
 * no route swap). Going to or from Status is a real route swap, so we
 * kick it through useTransition and render a destination-shaped skeleton
 * until React finishes rendering the new page.
 */
export function PropertiesNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setMode } = usePropertiesMode();

  const view = searchParams?.get("view") ?? "";
  const onStatusView = view === "launchpad";

  const [isPending, startTransition] = useTransition();
  const [pendingDest, setPendingDest] = useState<Dest | null>(null);

  // Clear the pending marker once the route actually lands.
  useEffect(() => {
    if (!isPending) setPendingDest(null);
  }, [isPending]);

  const navigateTo = useCallback(
    (dest: Dest) => {
      const goingToStatus = dest === "status";
      const needsRouteSwap = onStatusView || goingToStatus;

      if (!needsRouteSwap) {
        // Gallery ↔ Table: instant, no skeleton, no delay. Same component,
        // just toggling display modes. URL stays in sync via replaceState.
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

      // Route swap (to or from Status): preseed mode where applicable so
      // the new page lands on the correct tab, then transition the URL
      // change so useTransition's isPending covers the render wait.
      if (!goingToStatus) {
        setMode(dest as HomesMode);
      }
      setPendingDest(dest);
      startTransition(() => {
        if (goingToStatus) {
          router.push("/admin/properties?view=launchpad", { scroll: false });
        } else {
          router.push(
            `/admin/properties?view=details&mode=${dest}`,
            { scroll: false },
          );
        }
      });
    },
    [onStatusView, router, setMode],
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
    // Silent fallback so components outside a provider still render.
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
