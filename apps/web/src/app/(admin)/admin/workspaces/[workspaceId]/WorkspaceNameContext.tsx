"use client";

import { createContext, useContext } from "react";

export type WorkspaceNameContextValue = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
};

export const WorkspaceNameContext = createContext<WorkspaceNameContextValue | null>(null);

export function useWorkspaceName(): WorkspaceNameContextValue | null {
  return useContext(WorkspaceNameContext);
}
