import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState } from "../components";
import { CatCard } from "../CatCard";
import type { Pyrecat, Rarity } from "../types";
import { Note, RarityFilter, Spinner, type RarityFilterValue } from "../ui";

export interface GalleryProps {
  cats: Pyrecat[];
  total: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGoGenerate: () => void;
}

const EMPTY_COUNTS: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, mythic: 0 };

export function Gallery({ cats, total, loading, error, onRefresh, onGoGenerate }: GalleryProps): React.ReactElement {
  const [filter, setFilter] = useState<RarityFilterValue>("all");

  const counts = useMemo(() => {
    const next = { ...EMPTY_COUNTS };
    for (const cat of cats) next[cat.rarity] += 1;
    return next;
  }, [cats]);
  const rarityKinds = (Object.keys(counts) as Rarity[]).filter((rarity) => counts[rarity] > 0).length;

  // A refresh can make the selected rarity disappear from the list — fall back to "all" instead of showing nothing.
  useEffect(() => {
    if (filter !== "all" && counts[filter] === 0) setFilter("all");
  }, [filter, counts]);

  const visible = filter === "all" ? cats : cats.filter((cat) => cat.rarity === filter);

  return (
    <section aria-labelledby="gallery-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink" id="gallery-heading">
            Community gallery
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {cats.length > 0
              ? `The last ${cats.length} Pyrecats anyone rolled${
                  total > cats.length ? ` — ${total.toLocaleString()} generated all time` : ""
                }.`
              : "The most recently rolled Pyrecats, freshest first."}
          </p>
        </div>
        <Button disabled={loading} onClick={onRefresh} type="button" variant="secondary">
          {loading ? <Spinner label="Refreshing…" /> : "Refresh"}
        </Button>
      </div>

      {error !== null ? (
        <Note onRetry={onRefresh} tone="error">
          {error}
        </Note>
      ) : null}

      {loading && cats.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((slot) => (
            <div className="h-44 animate-pulse rounded-card border border-border bg-surface" key={slot} />
          ))}
        </div>
      ) : null}

      {!loading && cats.length === 0 && error === null ? (
        <EmptyState
          action={
            <Button onClick={onGoGenerate} type="button">
              Generate the first Pyrecat
            </Button>
          }
          title="No cats yet — the gallery starts with yours."
        />
      ) : null}

      {cats.length > 0 && rarityKinds > 1 ? (
        <RarityFilter counts={counts} label="Filter by rarity" onChange={setFilter} value={filter} />
      ) : null}

      {cats.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="gallery-list">
          {visible.map((cat) => (
            <li className="flex" key={cat.id}>
              <div className="flex w-full">
                <CatCard cat={cat} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
