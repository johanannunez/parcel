"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Lets a portal page dynamically override the title and subtitle that
 * PortalAppBar would otherwise compute from the route path.
 *
 * Usage pattern:
 *
 *   1. portal/layout.tsx wraps its children in <PortalHeaderProvider>.
 *   2. PortalAppBar calls `usePortalHeaderOverride()`. If the override is
 *      set, it renders that instead of the default `getPortalHeader(path)`.
 *   3. A page that wants a dynamic header renders <SetPortalHeader title=...
 *      subtitle=... /> anywhere inside its JSX. On mount the component
 *      writes into the context; on unmount (or route change) it clears
 *      the override so the next page falls back to the default lookup.
 *
 * This keeps layout → page data flow intact (pages can't pass props up),
 * while still letting individual routes personalize the AppBar when
 * they have data the shell doesn't.
 */

export type PortalHeaderOverride = {
  title: string;
  subtitle?: ReactNode;
  /**
   * If true, the AppBar renders a small copy-to-clipboard button next to
   * the title that copies `title` verbatim on click. Use on pages where
   * the title is a meaningful piece of data the user often wants to paste
   * elsewhere (e.g. a property address).
   */
  copyable?: boolean;
};

type PortalHeaderContextValue = {
  override: PortalHeaderOverride | null;
  setOverride: (value: PortalHeaderOverride | null) => void;
};

const PortalHeaderContext = createContext<PortalHeaderContextValue | null>(
  null,
);

export function PortalHeaderProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<PortalHeaderOverride | null>(
    null,
  );

  const setOverride = useCallback(
    (value: PortalHeaderOverride | null) => setOverrideState(value),
    [],
  );

  const value = useMemo(
    () => ({ override, setOverride }),
    [override, setOverride],
  );

  return (
    <PortalHeaderContext.Provider value={value}>
      {children}
    </PortalHeaderContext.Provider>
  );
}

/** Read the current override. Returns `null` if no page has set one. */
export function usePortalHeaderOverride(): PortalHeaderOverride | null {
  const ctx = useContext(PortalHeaderContext);
  return ctx?.override ?? null;
}

/**
 * Render this inside a page to set the AppBar title + subtitle for the
 * duration that the page is mounted. Clears the override when the page
 * unmounts so the next route falls back to the default lookup.
 *
 * Safe to render as a child of a server component because this is a
 * client component marked `"use client"`.
 */
export function SetPortalHeader({
  title,
  subtitle,
  copyable,
}: {
  title: string;
  subtitle?: ReactNode;
  copyable?: boolean;
}) {
  const ctx = useContext(PortalHeaderContext);

  useEffect(() => {
    if (!ctx) return;
    ctx.setOverride({ title, subtitle, copyable });
    return () => ctx.setOverride(null);
  }, [ctx, title, subtitle, copyable]);

  return null;
}
