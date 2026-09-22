import { LoginButton } from "@pyre/app-sdk/react";
import { CatCard } from "../CatCard";
import type { Pyrecat } from "../types";
import { BTN_GHOST, BTN_PRIMARY, Note, PANEL, Spinner } from "../ui";

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
  if (!loggedIn) {
    return (
      <section aria-labelledby="saved-heading" className={PANEL} data-testid="saved-signed-out">
        <h2 className="text-lg font-bold" id="saved-heading">
          My Pyrecats
        </h2>
        <p className="mt-2 max-w-prose text-sm text-white/65">
          Log in and your favourite cats are kept on your Pyre account — same shelf on every device, no wallet setup,
          no extensions.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <LoginButton className={BTN_PRIMARY}>Log in to start a collection</LoginButton>
          <button className={BTN_GHOST} onClick={onGoGenerate} type="button">
            Roll a cat first
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="saved-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" id="saved-heading">
            My Pyrecats
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {cats.length} of {limit} slots used.
          </p>
        </div>
        <button className={BTN_GHOST} disabled={loading} onClick={onRefresh} type="button">
          {loading ? <Spinner label="Loading…" /> : "Refresh"}
        </button>
      </div>

      {error !== null ? <Note onRetry={onRefresh} tone="error">{error}</Note> : null}

      {loading && cats.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((slot) => (
            <div className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" key={slot} />
          ))}
        </div>
      ) : null}

      {!loading && cats.length === 0 && error === null ? (
        <div className={PANEL} data-testid="saved-empty">
          <p className="text-sm text-white/70">Nothing saved yet. Roll a cat you like and hit save.</p>
          <button className={`${BTN_PRIMARY} mt-4`} onClick={onGoGenerate} type="button">
            Go to the generator
          </button>
        </div>
      ) : null}

      {cats.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="saved-list">
          {cats.map((cat) => (
            <li className="flex" key={cat.id}>
              <div className="flex w-full">
                <CatCard
                  action={
                    <button
                      className={BTN_GHOST}
                      disabled={removing === cat.id}
                      onClick={() => onRemove(cat.id)}
                      type="button"
                    >
                      {removing === cat.id ? <Spinner label="Removing…" /> : `Remove ${cat.name}`}
                    </button>
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
