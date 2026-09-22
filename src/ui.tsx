import type { ReactNode } from "react";
import { AdSlot } from "@pyre/app-sdk/react";

/** Shared class strings and small presentational pieces used across the views. */

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-55";

export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55";

export const PANEL = "rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6";

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
  error: "border-red-400/40 bg-red-400/10 text-red-100",
  info: "border-white/15 bg-white/5 text-white/80",
  good: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
};

export function Note({ tone, children, onRetry }: NoteProps): React.ReactElement {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry ? (
        <button className={BTN_GHOST} onClick={onRetry} type="button">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export interface AdRailProps {
  isHolder: boolean;
  ticker: string;
  minHold: string;
}

/** The ad slot non-holders see. Holders get the same space back as a thank-you line. */
export function AdRail({ isHolder, ticker, minHold }: AdRailProps): React.ReactElement {
  if (isHolder) {
    return (
      <p className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-100">
        Ad-free view unlocked — thanks for holding {ticker}.
      </p>
    );
  }
  return (
    <aside aria-label="Sponsored" className="flex flex-col gap-2">
      <AdSlot className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/85 no-underline" />
      <p className="text-xs text-white/50">
        Ads keep Pyrecat free for everyone. Hold {minHold} {ticker} to browse ad-free.
      </p>
    </aside>
  );
}
