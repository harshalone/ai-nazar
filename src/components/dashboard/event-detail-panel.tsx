import { Badge } from "@/components/ui/badge";
import type { StoredEvent } from "@/lib/store/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-subtle py-2.5 text-sm">
      <span className="text-foreground-subtle">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

export function EventDetailPanel({ event }: { event: StoredEvent }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-foreground-subtle uppercase">
          Summary
        </h3>
        <div>
          <Row label="Status">
            <Badge tone={event.status === "success" ? "good" : "danger"}>{event.status}</Badge>
          </Row>
          <Row label="Provider">{event.provider}</Row>
          <Row label="Model">{event.model}</Row>
          <Row label="Environment">{event.environment ?? "—"}</Row>
          <Row label="Latency">{event.latency ? `${event.latency}ms` : "—"}</Row>
          <Row label="Cost">{event.cost !== undefined ? `$${event.cost.toFixed(6)}` : "—"}</Row>
          <Row label="Input tokens">{event.inputTokens ?? "—"}</Row>
          <Row label="Output tokens">{event.outputTokens ?? "—"}</Row>
          <Row label="User ID">{event.userId ?? "—"}</Row>
          <Row label="Timestamp">{new Date(event.timestamp).toLocaleString()}</Row>
          <Row label="SDK">
            {event.sdk ? `${event.sdk.name}@${event.sdk.version}` : "—"}
          </Row>
        </div>
      </div>

      {event.error && (
        <div>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-danger uppercase">
            Error
          </h3>
          <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-foreground">
            <p className="font-medium">{event.error.message}</p>
            {event.error.code && (
              <p className="mt-1 text-xs text-foreground-muted">Code: {event.error.code}</p>
            )}
            {event.error.stack && (
              <pre className="mt-2 overflow-x-auto text-xs text-foreground-subtle">
                {event.error.stack}
              </pre>
            )}
          </div>
        </div>
      )}

      {event.metadata && Object.keys(event.metadata).length > 0 && (
        <JsonBlock title="Metadata" value={event.metadata} />
      )}
      {event.prompt !== undefined && <JsonBlock title="Prompt" value={event.prompt} />}
      {event.response !== undefined && <JsonBlock title="Response" value={event.response} />}
      {event.prompt === undefined && event.response === undefined && (
        <p className="text-xs text-foreground-subtle">
          Prompt/response content was not captured for this event (capturePrompts /
          captureResponses were disabled in the SDK).
        </p>
      )}
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-foreground-subtle uppercase">
        {title}
      </h3>
      <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-black p-3 text-xs leading-relaxed text-foreground-muted">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
