"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CreateScopeTarget =
  | { kind: "owner"; id: string; displayName: string; initials: string }
  | { kind: "property"; id: string; displayName: string; initials: string }
  | null;

type CreateScopeValue = {
  target: CreateScopeTarget;
  setTarget: (t: CreateScopeTarget) => void;
};

const CreateScopeContext = createContext<CreateScopeValue | null>(null);

export function CreateScopeProvider({
  initialTarget = null,
  children,
}: {
  initialTarget?: CreateScopeTarget;
  children: ReactNode;
}) {
  const [target, setTarget] = useState<CreateScopeTarget>(initialTarget);
  const value = useMemo(() => ({ target, setTarget }), [target]);
  return <CreateScopeContext.Provider value={value}>{children}</CreateScopeContext.Provider>;
}

export function useCreateScope() {
  const ctx = useContext(CreateScopeContext);
  if (!ctx) {
    throw new Error("useCreateScope must be used inside <CreateScopeProvider>. Admin layout mounts one at the root.");
  }
  return ctx;
}
