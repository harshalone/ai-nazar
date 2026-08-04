"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  ListTree,
  KeyRound,
  Settings,
  Menu,
  X,
  PanelLeftOpen,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: ListTree },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

// Ported from rotaapp.uk's dashboard sidebar — desktop icon-rail collapse
// (w-64 <-> w-20), mobile hamburger drawer, localStorage-persisted
// collapse state owned by the parent layout. See ARCHITECTURE.md.
export function DashboardSidebar({ isCollapsed, onToggleCollapsed }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <button
        type="button"
        className="fixed top-4 left-4 z-50 cursor-pointer rounded-md border border-border bg-surface p-2 text-foreground lg:hidden"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface transition-all duration-200 ease-in-out lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              "flex h-16 items-center justify-between border-b border-border px-6 lg:px-4",
              isCollapsed && "lg:justify-center",
            )}
          >
            <Link
              href="/"
              className={cn("flex items-center gap-2 overflow-hidden", isCollapsed && "lg:w-0")}
            >
              <Image
                src="/assets/images/logo.png"
                alt="AI Nazar"
                width={28}
                height={28}
                className="shrink-0"
              />
              <span
                className={cn(
                  "text-lg font-bold tracking-tight whitespace-nowrap text-foreground",
                  isCollapsed && "lg:hidden",
                )}
              >
                AI Nazar
              </span>
            </Link>

            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-foreground-subtle transition-colors hover:bg-surface-raised hover:text-foreground lg:flex"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isCollapsed && "lg:justify-center",
                    isActive
                      ? "bg-surface-raised text-brand"
                      : "text-foreground-muted hover:bg-surface-raised/80 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <span className={isCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs text-foreground-subtle",
                isCollapsed && "lg:justify-center lg:px-0",
              )}
            >
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full bg-brand")} />
              <span className={isCollapsed ? "lg:hidden" : ""}>Self-hosted</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
