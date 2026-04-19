'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type BoardToolsContextValue = {
  tools: ReactNode;
  setTools: (node: ReactNode) => void;
};

const BoardToolsContext = createContext<BoardToolsContextValue | null>(null);

export function BoardToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setToolsState] = useState<ReactNode>(null);
  const setTools = useCallback((node: ReactNode) => setToolsState(node), []);
  return (
    <BoardToolsContext.Provider value={{ tools, setTools }}>
      {children}
    </BoardToolsContext.Provider>
  );
}

export function useBoardTools(): BoardToolsContextValue {
  const ctx = useContext(BoardToolsContext);
  if (!ctx) {
    throw new Error('useBoardTools must be used inside BoardToolsProvider');
  }
  return ctx;
}
