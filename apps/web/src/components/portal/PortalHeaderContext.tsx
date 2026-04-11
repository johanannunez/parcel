"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  // Extract the STABLE setter function out of the context value. The
  // provider wraps setOverride in useCallback([],) so its reference never
  // changes, even though the wrapping context value object (ctx) is a
  // new reference on every override update. Putting ctx directly in the
  // deps array would cause an infinite loop: setOverride -> override
  // changes -> provider's useMemo produces a new value -> ctx is new ->
  // effect fires -> setOverride again. We bypass that by listing only
  // the stable function in deps.
  const setOverride = ctx?.setOverride;

  // Keep the latest subtitle (a ReactNode, so a fresh object every render)
  // in a ref so the effect below can read it without depending on it.
  // Listing subtitle as a dep would cause the same kind of infinite loop:
  // each render produces a new ReactNode reference which React compares
  // by identity and treats as changed.
  const subtitleRef = useRef(subtitle);
  subtitleRef.current = subtitle;

  useEffect(() => {
    if (!setOverride) return;
    setOverride({ title, subtitle: subtitleRef.current, copyable });
    return () => setOverride(null);
    // title + copyable are the stability signals. When title changes
    // (e.g. navigating between property detail pages) the effect re-runs
    // and picks up the fresh subtitle from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOverride, title, copyable]);

  return null;
}
