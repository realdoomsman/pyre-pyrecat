import type { ReactNode } from "react";
import { Button } from "./components";

/** Shared small presentational pieces used across the views. */

export function Spinner({ label }: { label: string }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      {label}
    </span>
  );
}

export interface NoteProps {
  tone: "error" | "info" | "good";
  children: ReactNode;
  onRetry?: () => void;
}

const TONES: Record<NoteProps["tone"], string> = {
  error: "border-danger/40 bg-danger-soft text-ink",
  info: "border-border bg-surface text-ink-muted",
  good: "border-violet/40 bg-violet-soft text-ink",
};

export function Note({ tone, children, onRetry }: NoteProps): React.ReactElement {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-card border px-4 py-3 text-sm ${TONES[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry ? (
        <Button onClick={onRetry} size="sm" type="button" variant="secondary">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
