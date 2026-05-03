"use client";

import { createContext, useContext } from "react";

export type EntityNameContextValue = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
};

export const EntityNameContext = createContext<EntityNameContextValue | null>(null);

export function useEntityName(): EntityNameContextValue | null {
  return useContext(EntityNameContext);
}
