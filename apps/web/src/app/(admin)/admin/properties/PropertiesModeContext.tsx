"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HomesMode } from "./homes-types";

type Ctx = {
  mode: HomesMode;
  setMode: (mode: HomesMode) => void;
};

const PropertiesModeContext = createContext<Ctx | null>(null);

export function PropertiesModeProvider({
  initialMode,
  children,
}: {
  initialMode: HomesMode;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<HomesMode>(initialMode);
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return (
    <PropertiesModeContext.Provider value={value}>
      {children}
    </PropertiesModeContext.Provider>
  );
}

export function usePropertiesMode(): Ctx {
  const ctx = useContext(PropertiesModeContext);
  if (!ctx) {
    return { mode: "gallery", setMode: () => {} };
  }
  return ctx;
}
