"use client";

import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

// Ported from rotaapp.uk's slide-panel-context.tsx — see ARCHITECTURE.md
// for why this pattern (global, portal-based, stack of entries) was
// chosen over a per-page modal/drawer.
export type SlidePanelSize = "quarter" | "third" | "half" | "twoThirds" | "wide" | "full";

export interface SlidePanelEntry {
  id: number;
  title: ReactNode;
  footer: ReactNode | null;
  size: SlidePanelSize;
  content: ReactNode;
  onClose: (() => void) | null;
  closing: boolean;
}

interface OpenPanelConfig {
  title: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  size?: SlidePanelSize;
  onClose?: () => void;
}

interface SlidePanelContextValue {
  stack: SlidePanelEntry[];
  open: (config: OpenPanelConfig) => void;
  close: () => void;
  update: (config: Omit<OpenPanelConfig, "onClose">) => void;
  /** @internal called by GlobalSlidePanel once a panel's close transition finishes. */
  removeClosed: (id: number) => void;
}

const SlidePanelContext = createContext<SlidePanelContextValue | null>(null);

export function SlidePanelProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<SlidePanelEntry[]>([]);
  const nextId = useRef(0);

  const close = useCallback(() => {
    setStack((prev) => {
      if (prev.length === 0) return prev;
      const top = prev[prev.length - 1];
      if (top.closing) return prev;
      return [...prev.slice(0, -1), { ...top, closing: true }];
    });
  }, []);

  const open = useCallback((config: OpenPanelConfig) => {
    setStack((prev) => [
      ...prev,
      {
        id: nextId.current++,
        title: config.title,
        content: config.content,
        footer: config.footer ?? null,
        size: config.size ?? "half",
        onClose: config.onClose ?? null,
        closing: false,
      },
    ]);
  }, []);

  const update = useCallback((config: Omit<OpenPanelConfig, "onClose">) => {
    setStack((prev) => {
      if (prev.length === 0) return prev;
      const top = prev[prev.length - 1];
      if (top.closing) return prev;
      return [
        ...prev.slice(0, -1),
        {
          ...top,
          title: config.title,
          content: config.content,
          footer: config.footer ?? null,
          size: config.size ?? top.size,
        },
      ];
    });
  }, []);

  const removeClosed = useCallback((id: number) => {
    setStack((prev) => {
      const entry = prev.find((p) => p.id === id);
      if (entry?.onClose) queueMicrotask(entry.onClose);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  return (
    <SlidePanelContext.Provider value={{ open, close, update, stack, removeClosed }}>
      {children}
    </SlidePanelContext.Provider>
  );
}

export function useSlidePanel(): SlidePanelContextValue {
  const ctx = useContext(SlidePanelContext);
  if (!ctx) throw new Error("useSlidePanel must be used inside SlidePanelProvider");
  return ctx;
}
