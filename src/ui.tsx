import type { ReactNode } from "react";
import { Button } from "./components";
import type { Rarity } from "./types";
import { RARITY_LABEL } from "./vibes";

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

export type RarityFilterValue = Rarity | "all";

export interface RarityFilterProps {
  label: string;
  counts: Record<Rarity, number>;
  value: RarityFilterValue;
  onChange: (value: RarityFilterValue) => void;
}

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "mythic"];

/** Filters a list down to one rarity. Hidden by the caller unless two or more are present. */
export function RarityFilter({ label, counts, value, onChange }: RarityFilterProps): React.ReactElement {
  const total = RARITY_ORDER.reduce((sum, rarity) => sum + counts[rarity], 0);
  const options: { key: RarityFilterValue; label: string; count: number }[] = [
    { key: "all", label: "All", count: total },
    ...RARITY_ORDER.filter((rarity) => counts[rarity] > 0).map((rarity) => ({
      key: rarity,
      label: RARITY_LABEL[rarity],
      count: counts[rarity],
    })),
  ];

  return (
    <div aria-label={label} className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            aria-pressed={active}
            className={[
              "inline-flex h-8 items-center gap-1.5 rounded-card border px-3 text-xs font-medium transition-colors",
              active
                ? "border-violet/50 bg-violet-soft text-violet"
                : "border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink",
            ].join(" ")}
            key={option.key}
            onClick={() => onChange(option.key)}
            type="button"
          >
            {option.label}
            <span className="font-mono text-[11px] tabular-nums opacity-70">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}
