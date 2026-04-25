"use client";

import { createContext, useContext } from "react";

export type ClientNameContextValue = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
};

export const ClientNameContext = createContext<ClientNameContextValue | null>(null);

export function useClientName(): ClientNameContextValue | null {
  return useContext(ClientNameContext);
}
