import { useEffect, useMemo, useState } from "react";
import { LoginButton } from "@pyre/app-sdk/react";
import { Button, buttonClassName, Card, EmptyState } from "../components";
import { CatCard } from "../CatCard";
import type { Pyrecat, Rarity } from "../types";
import { Note, RarityFilter, Spinner, type RarityFilterValue } from "../ui";

const EMPTY_COUNTS: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, mythic: 0 };

export interface CollectionProps {
  cats: Pyrecat[];
  limit: number;
  loading: boolean;
  error: string | null;
  loggedIn: boolean;
  removing: string | null;
  onRefresh: () => void;
  onRemove: (id: string) => void;
  onGoGenerate: () => void;
}

export function Collection({
  cats,
  limit,
  loading,
  error,
  loggedIn,
  removing,
  onRefresh,
  onRemove,
  onGoGenerate,
}: CollectionProps): React.ReactElement {
  const [filter, setFilter] = useState<RarityFilterValue>("all");

  const counts = useMemo(() => {
    const next = { ...EMPTY_COUNTS };
    for (const cat of cats) next[cat.rarity] += 1;
    return next;
  }, [cats]);
  const rarityKinds = (Object.keys(counts) as Rarity[]).filter((rarity) => counts[rarity] > 0).length;

  useEffect(() => {
    if (filter !== "all" && counts[filter] === 0) setFilter("all");
  }, [filter, counts]);

  const visible = filter === "all" ? cats : cats.filter((cat) => cat.rarity === filter);

  if (!loggedIn) {
    return (
      <Card
        data-testid="saved-signed-out"
        description="Log in and your favourite cats are kept on your Pyre account — same shelf on every device, no wallet setup, no extensions."
        title="My Pyrecats"
      >
        <div className="flex flex-wrap gap-3">
          <LoginButton className={buttonClassName("primary")}>Log in to start a collection</LoginButton>
          <Button onClick={onGoGenerate} type="button" variant="secondary">
            Roll a cat first
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <section aria-labelledby="saved-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink" id="saved-heading">
            My Pyrecats
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {cats.length} of {limit} slots used.
          </p>
        </div>
        <Button disabled={loading} onClick={onRefresh} type="button" variant="secondary">
          {loading ? <Spinner label="Loading…" /> : "Refresh"}
        </Button>
      </div>

      {error !== null ? (
        <Note onRetry={onRefresh} tone="error">
          {error}
        </Note>
      ) : null}

      {loading && cats.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((slot) => (
            <div className="h-44 animate-pulse rounded-card border border-border bg-surface" key={slot} />
          ))}
        </div>
      ) : null}

      {!loading && cats.length === 0 && error === null ? (
        <EmptyState
          action={
            <Button onClick={onGoGenerate} type="button">
              Go to the generator
            </Button>
          }
          data-testid="saved-empty"
          title="Nothing saved yet."
          description="Roll a cat you like and hit save."
        />
      ) : null}

      {cats.length > 0 && rarityKinds > 1 ? (
        <RarityFilter counts={counts} label="Filter by rarity" onChange={setFilter} value={filter} />
      ) : null}

      {cats.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="saved-list">
          {visible.map((cat) => (
            <li className="flex" key={cat.id}>
              <div className="flex w-full">
                <CatCard
                  action={
                    <Button
                      disabled={removing === cat.id}
                      onClick={() => onRemove(cat.id)}
                      type="button"
                      variant="secondary"
                    >
                      {removing === cat.id ? <Spinner label="Removing…" /> : `Remove ${cat.name}`}
                    </Button>
                  }
                  cat={cat}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
