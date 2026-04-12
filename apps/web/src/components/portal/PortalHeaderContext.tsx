"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
 * Architecture: the state and the setter live in SEPARATE contexts so
 * readers (PortalAppBar) and writers (SetPortalHeader) are fully
 * isolated. A writer calling setOverride only re-renders readers, never
 * other writers. This prevents the class of infinite re-render bug where
 * a writer component consumes the full context just to read the setter,
 * sees a new wrapping value object on every override update, and
 * re-fires its useEffect because its deps changed. Splitting the
 * contexts makes the setter a permanently-stable reference that writers
 * can safely put in their effect deps.
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

type SetOverride = (value: PortalHeaderOverride | null) => void;

const PortalHeaderStateContext = createContext<PortalHeaderOverride | null>(
  null,
);

const PortalHeaderSetterContext = createContext<SetOverride>(() => {
  // Noop fallback so SetPortalHeader rendered outside a provider doesn't
  // crash. In practice portal/layout.tsx always mounts the provider above
  // any consumer, so this branch never executes at runtime.
});

export function PortalHeaderProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<PortalHeaderOverride | null>(
    null,
  );

  // Stable function reference. Empty dep array -> same reference for the
  // lifetime of the provider, which means writer components can safely
  // list it in their useEffect deps without retriggering on every state
  // update.
  const setOverride = useCallback<SetOverride>((value) => {
    setOverrideState(value);
  }, []);

  return (
    <PortalHeaderSetterContext.Provider value={setOverride}>
      <PortalHeaderStateContext.Provider value={override}>
        {children}
      </PortalHeaderStateContext.Provider>
    </PortalHeaderSetterContext.Provider>
  );
}

/**
 * Read the current override. Returns `null` if no page has set one.
 * Consumers re-render when the override changes (PortalAppBar).
 */
export function usePortalHeaderOverride(): PortalHeaderOverride | null {
  return useContext(PortalHeaderStateContext);
}

/**
 * Get the stable setter to write the override. Consumers of this hook do
 * NOT re-render when the override changes because the setter context
 * never updates after mount.
 */
export function useSetPortalHeaderOverride(): SetOverride {
  return useContext(PortalHeaderSetterContext);
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
  const setOverride = useSetPortalHeaderOverride();

  // Keep the latest subtitle (a ReactNode, so a fresh object every render)
  // in a ref so the effect below can read it without depending on it.
  // Listing subtitle as a dep would cause an infinite loop since each
  // render produces a new ReactNode reference.
  const subtitleRef = useRef(subtitle);
  subtitleRef.current = subtitle;

  useEffect(() => {
    setOverride({ title, subtitle: subtitleRef.current, copyable });
    return () => setOverride(null);
    // title + copyable are the stability signals. When title changes
    // (e.g. navigating between property detail pages) the effect re-runs
    // and picks up the fresh subtitle from the ref. setOverride is a
    // permanently-stable reference from a non-updating setter context,
    // so including it in deps is safe.
  }, [setOverride, title, copyable]);

  return null;
}
