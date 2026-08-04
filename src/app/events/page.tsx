"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSlidePanel } from "@/lib/slide-panel-context";
import { EventDetailPanel } from "@/components/dashboard/event-detail-panel";
import type { StoredEvent } from "@/lib/store/types";
import { cn } from "@/lib/utils/cn";

export default function EventsPage() {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { open } = useSlidePanel();

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/events");
    const page = await response.json();
    setEvents(page.events ?? []);
    setCursor(page.nextCursor ?? null);
    setLoading(false);
  }, []);

  // Effect body itself performs no synchronous setState — it kicks off an
  // async load whose state updates all happen after an await, which is
  // what react-hooks/set-state-in-effect wants (only same-tick setState
  // calls are flagged).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch("/api/events");
      const page = await response.json();
      if (cancelled) return;
      setEvents(page.events ?? []);
      setCursor(page.nextCursor ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const response = await fetch(`/api/events?cursor=${encodeURIComponent(cursor)}`);
    const page = await response.json();
    setEvents((prev) => [...prev, ...(page.events ?? [])]);
    setCursor(page.nextCursor ?? null);
    setLoadingMore(false);
  }

  function openEvent(event: StoredEvent) {
    open({
      title: `${event.provider} · ${event.model}`,
      size: "half",
      content: <EventDetailPanel event={event} />,
    });
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Every AI request tracked by the SDK, most recent first.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClickAsync={load}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-foreground-subtle">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-foreground-subtle">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">No events yet. Send a request through the SDK.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-foreground-subtle uppercase">
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Provider / Model</th>
                    <th className="px-4 py-3 font-medium">Latency</th>
                    <th className="px-4 py-3 font-medium">Tokens</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      onClick={() => openEvent(event)}
                      className={cn(
                        "cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-raised",
                      )}
                    >
                      <td className="px-4 py-3">
                        <Badge tone={event.status === "success" ? "good" : "danger"}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{event.model}</div>
                        <div className="text-xs text-foreground-subtle">{event.provider}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {event.latency ? `${event.latency}ms` : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {event.totalTokens ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {event.cost !== undefined ? `$${event.cost.toFixed(4)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-subtle">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {cursor && (
          <div className="flex justify-center">
            <Button variant="secondary" loading={loadingMore} onClickAsync={loadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
