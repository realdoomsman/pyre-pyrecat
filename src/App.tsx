import { useCallback, useEffect, useState } from "react";
import { ship, pyreEnv } from "@pyre/app-sdk";
import { LoginButton, usePyre } from "@pyre/app-sdk/react";
import { CatAvatar } from "./CatAvatar";
import { CAT_FACTS, factOfTheDay } from "./catFacts";
import { Button, buttonClassName, Card } from "./components";
import { Collection } from "./views/Collection";
import { Gallery } from "./views/Gallery";
import { Generator } from "./views/Generator";
import type { CollectionResult, GalleryResult, GenerateResult, Pyrecat, Rarity } from "./types";

type Tab = "generate" | "gallery" | "saved";

const TABS: { key: Tab; label: string }[] = [
  { key: "generate", label: "Generate" },
  { key: "gallery", label: "Gallery" },
  { key: "saved", label: "My Pyrecats" },
];

const DAILY_RARITIES: Rarity[] = ["common", "uncommon", "rare", "mythic"];

function message(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message !== "" ? cause.message : fallback;
}

export default function App(): React.ReactElement {
  const env = pyreEnv();
  const { user, holder } = usePyre();
  const ticker = env.ticker !== undefined && env.ticker !== "" ? `$${env.ticker}` : "$PYRECAT";
  const parsedMin = Number(holder.minHold);
  const minHold = Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin.toLocaleString() : "10,000";
  const isHolder = holder.isHolder;
  const loggedIn = user !== null;

  const [tab, setTab] = useState<Tab>("generate");

  const [galleryCats, setGalleryCats] = useState<Pyrecat[]>([]);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const [saved, setSaved] = useState<Pyrecat[]>([]);
  const [savedLimit, setSavedLimit] = useState(40);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const [factIndex, setFactIndex] = useState(() => factOfTheDay());

  const loadGallery = useCallback(async (): Promise<void> => {
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const result = await ship.fn<GalleryResult>("gallery", {});
      setGalleryCats(Array.isArray(result.cats) ? result.cats : []);
      setGalleryTotal(typeof result.total === "number" ? result.total : 0);
    } catch (cause) {
      setGalleryError(message(cause, "The gallery could not be loaded just now."));
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  const loadSaved = useCallback(async (): Promise<void> => {
    setSavedLoading(true);
    setSavedError(null);
    try {
      const result = await ship.fn<CollectionResult>("collection", { action: "list" });
      if (!result.ok && result.reason === "auth") {
        setSaved([]);
        setSavedError("Your session expired — log in again to see your collection.");
        return;
      }
      setSaved(Array.isArray(result.cats) ? result.cats : []);
      if (typeof result.limit === "number") setSavedLimit(result.limit);
    } catch (cause) {
      setSavedError(message(cause, "Your collection could not be loaded just now."));
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  useEffect(() => {
    if (!loggedIn) {
      setSaved([]);
      setSavedError(null);
      return;
    }
    void loadSaved();
  }, [loggedIn, loadSaved]);

  const generate = useCallback(async (vibe: string): Promise<GenerateResult> => {
    const result = await ship.fn<GenerateResult>("generate", { vibe });
    setGalleryCats((previous) => [result.cat, ...previous.filter((cat) => cat.id !== result.cat.id)].slice(0, 20));
    if (typeof result.total === "number") setGalleryTotal(result.total);
    setGalleryError(null);
    return result;
  }, []);

  const saveCat = useCallback(async (cat: Pyrecat): Promise<string> => {
    const result = await ship.fn<CollectionResult>("collection", { action: "save", cat });
    if (Array.isArray(result.cats)) setSaved(result.cats);
    if (typeof result.limit === "number") setSavedLimit(result.limit);
    if (!result.ok) {
      if (result.reason === "auth") throw new Error("Log in to keep cats in your collection.");
      if (result.reason === "full") {
        throw new Error(`Your collection is full at ${result.limit} cats — remove one to make room.`);
      }
      throw new Error("That cat could not be saved. Roll another and try again.");
    }
    return result.saved === false
      ? `${cat.name} is already in your collection.`
      : `${cat.name} is now in My Pyrecats.`;
  }, []);

  const removeCat = useCallback((id: string): void => {
    setRemoving(id);
    setSavedError(null);
    void ship
      .fn<CollectionResult>("collection", { action: "remove", id })
      .then((result) => {
        if (Array.isArray(result.cats)) setSaved(result.cats);
      })
      .catch((cause: unknown) => {
        setSavedError(message(cause, "That cat could not be removed. Try again."));
      })
      .finally(() => setRemoving(null));
  }, []);

  const login = useCallback(async (): Promise<void> => {
    try {
      await ship.login();
      await loadSaved();
    } catch (cause) {
      setSavedError(message(cause, "Login is unavailable right now."));
    }
  }, [loadSaved]);

  const dayKey = new Date().toISOString().slice(0, 10);
  const dailyRarity = DAILY_RARITIES[factOfTheDay() % DAILY_RARITIES.length];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CatAvatar className="size-11 shrink-0" name="pyrecat-mark" rarity="mythic" />
          <div>
            <h1 className="text-2xl text-ink sm:text-3xl">Pyrecat</h1>
            <p className="font-mono text-xs text-ink-faint">{ticker} · cattery on Pyre</p>
          </div>
        </div>
        <LoginButton className={buttonClassName("secondary")}>Log in</LoginButton>
      </header>

      <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-mono text-xs tracking-wide text-violet uppercase">Cat personas, on demand</p>
          <h2 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
            Every Pyrecat is written once and never again.
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-muted sm:text-base">
            Roll a cat and the cattery invents a name, a personality quirk and a one-line backstory, then draws its
            portrait from the name itself. Keep the ones you love on your Pyre account, and browse what everyone else
            has rolled. Free for everyone; holders of {minHold} {ticker} get four extra vibes, the rare cat table and
            a holder badge on everything they save.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => setTab("generate")} type="button">
              Generate a Pyrecat
            </Button>
            <Button onClick={() => setTab("gallery")} type="button" variant="secondary">
              See the gallery
            </Button>
          </div>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="font-mono text-xs tracking-wide text-ink-faint uppercase">Cats rolled</dt>
              <dd className="font-mono text-lg tabular-nums text-ink">{galleryTotal.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-ink-faint uppercase">In the gallery</dt>
              <dd className="font-mono text-lg tabular-nums text-ink">{galleryCats.length}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs tracking-wide text-ink-faint uppercase">Your shelf</dt>
              <dd className="font-mono text-lg tabular-nums text-ink">{loggedIn ? saved.length : "—"}</dd>
            </div>
          </dl>
        </div>

        <figure className="flex w-full shrink-0 flex-col items-center gap-3 sm:w-56">
          <CatAvatar
            className="size-40 rounded-card ring-1 ring-border sm:size-52"
            name={`daily-${dayKey}`}
            rarity={dailyRarity}
          />
          <figcaption className="text-center text-xs text-ink-faint">
            Today&apos;s cat art — drawn from {dayKey}, new every day
          </figcaption>
        </figure>
      </Card>

      <Card aria-labelledby="fact-heading" className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-mono text-xs font-semibold tracking-wide text-ink-faint uppercase" id="fact-heading">
            Cat fact
          </h2>
          <p className="mt-1 text-sm text-ink" data-testid="cat-fact">
            {CAT_FACTS[factIndex]}
          </p>
        </div>
        <Button
          onClick={() => setFactIndex((current) => (current + 1) % CAT_FACTS.length)}
          type="button"
          variant="secondary"
        >
          Another fact
        </Button>
      </Card>

      <nav aria-label="Sections" className="-mx-1 overflow-x-auto">
        <ul className="flex min-w-max gap-2 px-1">
          {TABS.map((entry) => {
            const active = tab === entry.key;
            return (
              <li key={entry.key}>
                <button
                  aria-current={active ? "page" : undefined}
                  className={[
                    "rounded-card border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-violet/40 bg-violet-soft text-violet"
                      : "border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink",
                  ].join(" ")}
                  onClick={() => setTab(entry.key)}
                  type="button"
                >
                  {entry.label}
                  {entry.key === "saved" && loggedIn && saved.length > 0 ? ` (${saved.length})` : ""}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <main>
        {tab === "generate" ? (
          <Generator
            isHolder={isHolder}
            loggedIn={loggedIn}
            minHold={minHold}
            onGenerate={generate}
            onLogin={login}
            onSave={saveCat}
            savedIds={saved.map((cat) => cat.id)}
            ticker={ticker}
          />
        ) : null}
        {tab === "gallery" ? (
          <Gallery
            cats={galleryCats}
            error={galleryError}
            loading={galleryLoading}
            onGoGenerate={() => setTab("generate")}
            onRefresh={() => void loadGallery()}
            total={galleryTotal}
          />
        ) : null}
        {tab === "saved" ? (
          <Collection
            cats={saved}
            error={savedError}
            limit={savedLimit}
            loading={savedLoading}
            loggedIn={loggedIn}
            onGoGenerate={() => setTab("generate")}
            onRefresh={() => void loadSaved()}
            onRemove={removeCat}
            removing={removing}
          />
        ) : null}
      </main>

      <footer className="mt-auto border-t border-border pt-6 text-xs text-ink-faint">
        <p>
          {loggedIn ? `Signed in as ${user.displayName ?? user.wallet ?? user.id}. ` : ""}
          Pyrecat is built and funded by {ticker} on Pyre. Cat portraits are drawn in the browser — no images are
          uploaded or fetched.
        </p>
      </footer>
    </div>
  );
}
