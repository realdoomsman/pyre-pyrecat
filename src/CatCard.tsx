import type { ReactNode } from "react";
import { CatAvatar } from "./CatAvatar";
import type { Pyrecat } from "./types";
import { RARITY_CHIP, RARITY_LABEL } from "./vibes";

export interface CatCardProps {
  cat: Pyrecat;
  /** Buttons rendered in the card footer (save, remove, …). */
  action?: ReactNode;
  featured?: boolean;
}

export function CatCard({ cat, action, featured = false }: CatCardProps): React.ReactElement {
  return (
    <article
      className={[
        "flex flex-col gap-4 rounded-card border bg-surface p-4 transition-colors sm:p-5",
        featured ? "border-violet/40 bg-violet-soft" : "border-border hover:border-border-strong",
      ].join(" ")}
      data-testid="cat-card"
    >
      <div className="flex items-start gap-4">
        <CatAvatar
          className={featured ? "size-24 shrink-0 sm:size-32" : "size-16 shrink-0 sm:size-20"}
          name={cat.name}
          rarity={cat.rarity}
        />
        <div className="min-w-0 flex-1">
          <h3
            className={
              featured
                ? "font-display text-2xl break-words text-ink sm:text-3xl"
                : "text-base font-semibold break-words text-ink"
            }
            data-testid="cat-name"
          >
            {cat.name}
          </h3>
          <p className="mt-1 text-sm text-violet">{cat.trait}</p>
          <ul className="mt-2 flex flex-wrap items-center gap-1.5">
            <li className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium ${RARITY_CHIP[cat.rarity]}`}>
              {RARITY_LABEL[cat.rarity]}
            </li>
            <li className="rounded-md border border-border bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-ink-muted">
              {cat.vibeLabel}
            </li>
            {cat.holderBadge ? (
              <li className="rounded-md border border-violet/40 bg-violet-soft px-2 py-0.5 font-mono text-[11px] font-medium text-violet">
                Holder
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <p className={featured ? "text-base leading-relaxed text-ink" : "text-sm leading-relaxed text-ink-muted"}>
        {cat.backstory}
      </p>

      {action ? <div className="mt-auto flex flex-wrap gap-2 pt-1">{action}</div> : null}
    </article>
  );
}
