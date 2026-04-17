"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
  type ReactNode,
} from "react";

export type TopBarSlots = {
  centerSlot: ReactNode | null;
  searchOverride: ReactNode | null;
  hideHelp: boolean;
};

const EMPTY: TopBarSlots = {
  centerSlot: null,
  searchOverride: null,
  hideHelp: false,
};

type Ctx = {
  slots: TopBarSlots;
  set: (slots: TopBarSlots) => void;
  clear: () => void;
};

const TopBarSlotsContext = createContext<Ctx | null>(null);

export function TopBarSlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<TopBarSlots>(EMPTY);

  const set = useCallback((next: TopBarSlots) => setSlots(next), []);
  const clear = useCallback(() => setSlots(EMPTY), []);

  const value = useMemo(() => ({ slots, set, clear }), [slots, set, clear]);

  return (
    <TopBarSlotsContext.Provider value={value}>
      {children}
    </TopBarSlotsContext.Provider>
  );
}

export function useTopBarSlots(): TopBarSlots {
  const ctx = useContext(TopBarSlotsContext);
  return ctx?.slots ?? EMPTY;
}

/**
 * Push slot content from a route into the admin top bar. The content is
 * cleared automatically when the calling component unmounts. The `deps`
 * argument controls when the slot state is rebuilt, matching the normal
 * `useEffect` contract. Pass identifiers of anything that influences the
 * slot content (route key, filter state, etc.).
 */
export function useSetTopBarSlots(
  build: () => Partial<TopBarSlots>,
  deps: DependencyList,
) {
  const ctx = useContext(TopBarSlotsContext);
  useEffect(() => {
    if (!ctx) return;
    const next = build();
    ctx.set({
      centerSlot: next.centerSlot ?? null,
      searchOverride: next.searchOverride ?? null,
      hideHelp: next.hideHelp ?? false,
    });
    return () => ctx.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
