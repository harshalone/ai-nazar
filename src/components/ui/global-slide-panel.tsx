"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useSlidePanel, type SlidePanelSize } from "@/lib/slide-panel-context";

const SIZE_CLASSES: Record<SlidePanelSize, string> = {
  quarter: "w-full sm:w-1/4",
  third: "w-full sm:w-1/3",
  half: "w-full sm:w-1/2",
  twoThirds: "w-full sm:w-2/3",
  wide: "w-full sm:w-[90%]",
  full: "w-full",
};

const BASE_Z_INDEX = 70;
const CLOSE_TRANSITION_MS = 300;

/**
 * Global, stackable, flicker-free slide-over panel — ported from
 * rotaapp.uk (see slide-panel-context.tsx). Mounted once in the root
 * layout. Portals to document.body so panels never affect page layout;
 * pure transform/opacity animation avoids any reflow.
 */
// No SSR-safe way to know `document.body` exists other than deferring to
// the client subscription snapshot — this is the supported alternative
// to a `useState(false)` + `useEffect(() => setMounted(true))` pair.
function subscribeNoop() {
  return () => {};
}

export function GlobalSlidePanel() {
  const { stack, close, removeClosed } = useSlidePanel();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [enteredIds, setEnteredIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const pendingIds = stack.filter((p) => !p.closing && !enteredIds.has(p.id)).map((p) => p.id);
    if (pendingIds.length === 0) return;
    const frame = requestAnimationFrame(() => {
      setEnteredIds((prev) => {
        const next = new Set(prev);
        pendingIds.forEach((id) => next.add(id));
        return next;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [stack, enteredIds]);

  useEffect(() => {
    if (stack.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [stack.length, close]);

  useEffect(() => {
    if (stack.length === 0) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [stack.length]);

  useEffect(() => {
    const closingIds = stack.filter((p) => p.closing).map((p) => p.id);
    if (closingIds.length === 0) return;
    const timers = closingIds.map((id) =>
      setTimeout(() => {
        removeClosed(id);
        setEnteredIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, CLOSE_TRANSITION_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [stack, removeClosed]);

  if (!mounted || stack.length === 0) return null;

  return createPortal(
    <>
      {stack.map((panel, index) => {
        const isOpen = !panel.closing && enteredIds.has(panel.id);
        const widthClass = SIZE_CLASSES[panel.size] ?? SIZE_CLASSES.half;
        const zIndex = BASE_Z_INDEX + index * 2;

        return (
          <div
            key={panel.id}
            className="fixed inset-0"
            style={{ zIndex, pointerEvents: isOpen ? "auto" : "none" }}
            aria-hidden={!isOpen}
          >
            <div
              className="absolute inset-0 bg-black/70 transition-opacity duration-300"
              style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
              onClick={index === stack.length - 1 ? close : undefined}
            />

            <div
              role="dialog"
              aria-modal="true"
              className={`absolute inset-x-0 bottom-0 flex h-[100dvh] flex-col border-t border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:h-full sm:rounded-t-none sm:border-t-0 sm:border-l ${widthClass} ${
                isOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"
              }`}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-4">
                <div className="truncate pr-4 text-lg font-bold text-foreground">{panel.title}</div>
                <button
                  type="button"
                  onClick={index === stack.length - 1 ? close : undefined}
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground-subtle hover:bg-surface-raised hover:text-foreground sm:h-9 sm:w-9 sm:rounded-md"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {panel.content}
              </div>

              {panel.footer && (
                <div className="shrink-0 border-t border-border bg-surface px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
                  {panel.footer}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>,
    document.body,
  );
}
