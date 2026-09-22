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
        "flex flex-col gap-4 rounded-2xl border bg-white/[0.04] p-4 transition-colors sm:p-5",
        featured ? "border-amber-400/40 bg-amber-400/[0.06]" : "border-white/10 hover:border-white/20",
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
            className={featured ? "text-xl font-bold break-words sm:text-3xl" : "text-base font-bold break-words"}
            data-testid="cat-name"
          >
            {cat.name}
          </h3>
          <p className="mt-1 text-sm text-amber-200/90">{cat.trait}</p>
          <ul className="mt-2 flex flex-wrap items-center gap-1.5">
            <li
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${RARITY_CHIP[cat.rarity]}`}
            >
              {RARITY_LABEL[cat.rarity]}
            </li>
            <li className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
              {cat.vibeLabel}
            </li>
            {cat.holderBadge ? (
              <li className="rounded-full border border-amber-400/50 bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                Holder
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <p className={featured ? "text-base leading-relaxed text-white/85" : "text-sm leading-relaxed text-white/70"}>
        {cat.backstory}
      </p>

      {action ? <div className="mt-auto flex flex-wrap gap-2 pt-1">{action}</div> : null}
    </article>
  );
}
