import { Button, EmptyState } from "../components";
import { CatCard } from "../CatCard";
import type { Pyrecat } from "../types";
import { Note, Spinner } from "../ui";

export interface GalleryProps {
  cats: Pyrecat[];
  total: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGoGenerate: () => void;
}

export function Gallery({ cats, total, loading, error, onRefresh, onGoGenerate }: GalleryProps): React.ReactElement {
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

      {cats.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="gallery-list">
          {cats.map((cat) => (
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
