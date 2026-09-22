import { CatCard } from "../CatCard";
import type { Pyrecat } from "../types";
import { AdRail, BTN_GHOST, BTN_PRIMARY, Note, PANEL, Spinner } from "../ui";

export interface GalleryProps {
  cats: Pyrecat[];
  total: number;
  loading: boolean;
  error: string | null;
  isHolder: boolean;
  ticker: string;
  minHold: string;
  onRefresh: () => void;
  onGoGenerate: () => void;
}

export function Gallery({
  cats,
  total,
  loading,
  error,
  isHolder,
  ticker,
  minHold,
  onRefresh,
  onGoGenerate,
}: GalleryProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="gallery-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" id="gallery-heading">
              Community gallery
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {cats.length > 0
                ? `The last ${cats.length} Pyrecats anyone rolled${
                    total > cats.length ? ` — ${total.toLocaleString()} generated all time` : ""
                  }.`
                : "The most recently rolled Pyrecats, freshest first."}
            </p>
          </div>
          <button className={BTN_GHOST} disabled={loading} onClick={onRefresh} type="button">
            {loading ? <Spinner label="Refreshing…" /> : "Refresh"}
          </button>
        </div>

        {error !== null ? <Note onRetry={onRefresh} tone="error">{error}</Note> : null}

        {loading && cats.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((slot) => (
              <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" key={slot} />
            ))}
          </div>
        ) : null}

        {!loading && cats.length === 0 && error === null ? (
          <div className={PANEL}>
            <p className="text-sm text-white/70">No cats yet — the gallery starts with yours.</p>
            <button className={`${BTN_PRIMARY} mt-4`} onClick={onGoGenerate} type="button">
              Generate the first Pyrecat
            </button>
          </div>
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

      <AdRail isHolder={isHolder} minHold={minHold} ticker={ticker} />
    </div>
  );
}
