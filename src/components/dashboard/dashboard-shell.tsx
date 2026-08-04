"use client";

import type { ReactNode } from "react";
import { DashboardSidebar } from "./sidebar";
import { cn } from "@/lib/utils/cn";
import { useLocalStorageBoolean } from "@/lib/utils/use-local-storage-boolean";

const COLLAPSED_STORAGE_KEY = "ainazar:sidebar-collapsed";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useLocalStorageBoolean(COLLAPSED_STORAGE_KEY);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isCollapsed={isCollapsed}
        onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      />
      <main
        className={cn(
          "min-h-screen transition-[padding] duration-200 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
