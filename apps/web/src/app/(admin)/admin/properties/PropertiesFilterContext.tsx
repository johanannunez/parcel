"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FilterSelection } from "./PropertyFilterPopover";

type Ctx = {
  selection: FilterSelection;
  setSelection: (next: FilterSelection) => void;
};

const PropertiesFilterContext = createContext<Ctx | null>(null);

export function PropertiesFilterProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<FilterSelection>({
    ownerIds: new Set<string>(),
    propertyIds: new Set<string>(),
  });
  const value = useMemo(() => ({ selection, setSelection }), [selection]);
  return (
    <PropertiesFilterContext.Provider value={value}>
      {children}
    </PropertiesFilterContext.Provider>
  );
}

export function usePropertiesFilter(): Ctx {
  const ctx = useContext(PropertiesFilterContext);
  if (!ctx) {
    // Routes outside the properties layout see an inert default.
    return {
      selection: { ownerIds: new Set(), propertyIds: new Set() },
      setSelection: () => {},
    };
  }
  return ctx;
}
