import { useState } from "react";
import { HolderGate } from "@pyre/app-sdk/react";
import { CatCard } from "../CatCard";
import type { GenerateResult, Pyrecat } from "../types";
import { VIBES } from "../vibes";
import { AdRail, BTN_GHOST, BTN_PRIMARY, Note, PANEL, Spinner } from "../ui";

export interface GeneratorProps {
  isHolder: boolean;
  ticker: string;
  minHold: string;
  loggedIn: boolean;
  savedIds: string[];
  onGenerate: (vibe: string) => Promise<GenerateResult>;
  onSave: (cat: Pyrecat) => Promise<string>;
  onLogin: () => Promise<void>;
}

const FREE_VIBES = VIBES.filter((vibe) => !vibe.holderOnly);
const HOLDER_VIBES = VIBES.filter((vibe) => vibe.holderOnly);

export function Generator({
  isHolder,
  ticker,
  minHold,
  loggedIn,
  savedIds,
  onGenerate,
  onSave,
  onLogin,
}: GeneratorProps): React.ReactElement {
  const [vibe, setVibe] = useState("cozy");
  const [cat, setCat] = useState<Pyrecat | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downgraded, setDowngraded] = useState(false);
  const [saveState, setSaveState] = useState<{ tone: "good" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const alreadySaved = cat !== null && savedIds.includes(cat.id);

  const run = async (): Promise<void> => {
    setRunning(true);
    setError(null);
    setSaveState(null);
    try {
      const result = await onGenerate(vibe);
      setCat(result.cat);
      setDowngraded(result.downgraded);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message !== ""
          ? cause.message
          : "The cattery is briefly unreachable. Give it another go.",
      );
    } finally {
      setRunning(false);
    }
  };

  const save = async (): Promise<void> => {
    if (cat === null) return;
    setSaving(true);
    setSaveState(null);
    try {
      const text = await onSave(cat);
      setSaveState({ tone: "good", text });
    } catch (cause) {
      setSaveState({
        tone: "error",
        text: cause instanceof Error && cause.message !== "" ? cause.message : "Could not save that one.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="gen-heading" className={PANEL}>
        <h2 className="text-lg font-bold" id="gen-heading">
          Roll a new Pyrecat
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Pick a vibe and the cattery writes a name, a personality quirk and a one-line backstory.
        </p>

        <fieldset className="mt-5">
          <legend className="text-xs font-semibold tracking-wide text-white/50 uppercase">Vibe</legend>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {FREE_VIBES.map((option) => (
              <VibeOption
                key={option.key}
                blurb={option.blurb}
                checked={vibe === option.key}
                label={option.label}
                onSelect={() => setVibe(option.key)}
                value={option.key}
              />
            ))}
          </div>

          <HolderGate
            fallback={
              <div className="mt-4 rounded-xl border border-dashed border-amber-400/35 bg-amber-400/[0.05] p-4">
                <p className="text-sm font-semibold text-amber-100">
                  {HOLDER_VIBES.length} more vibes + the rare cat table
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {HOLDER_VIBES.map((option) => (
                    <li
                      key={option.key}
                      className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/55"
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-white/60">
                  Hold {minHold} {ticker} to unlock these vibes, roll Rare and Mythic cats, stamp a holder badge on
                  everything you save, and drop the ads.
                </p>
              </div>
            }
          >
            <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-400/[0.06] p-4">
              <p className="text-xs font-semibold tracking-wide text-amber-200 uppercase">
                Holder vibes · rare table live
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {HOLDER_VIBES.map((option) => (
                  <VibeOption
                    key={option.key}
                    blurb={option.blurb}
                    checked={vibe === option.key}
                    label={option.label}
                    onSelect={() => setVibe(option.key)}
                    value={option.key}
                  />
                ))}
              </div>
            </div>
          </HolderGate>
        </fieldset>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className={BTN_PRIMARY} data-testid="generate" disabled={running} onClick={() => void run()} type="button">
            {running ? <Spinner label="Consulting the cattery…" /> : "Generate a Pyrecat"}
          </button>
          {cat !== null && !running ? <span className="text-xs text-white/45">Roll again for a new one.</span> : null}
        </div>

        {error !== null ? (
          <div className="mt-4">
            <Note onRetry={() => void run()} tone="error">
              {error}
            </Note>
          </div>
        ) : null}
      </section>

      {running && cat === null ? (
        <div className={PANEL} data-testid="generate-pending">
          <p className="text-sm text-white/60">
            <Spinner label="Naming your cat…" />
          </p>
        </div>
      ) : null}

      {cat !== null ? (
        <section aria-labelledby="result-heading" className="flex flex-col gap-3">
          <h2 className="sr-only" id="result-heading">
            Your Pyrecat
          </h2>
          <CatCard
            action={
              loggedIn ? (
                <button
                  className={BTN_GHOST}
                  data-testid="save-cat"
                  disabled={saving || alreadySaved}
                  onClick={() => void save()}
                  type="button"
                >
                  {saving ? <Spinner label="Saving…" /> : alreadySaved ? "Saved ✓" : "Save to My Pyrecats"}
                </button>
              ) : (
                <button className={BTN_GHOST} data-testid="save-login" onClick={() => void onLogin()} type="button">
                  Log in to save this cat
                </button>
              )
            }
            cat={cat}
            featured
          />
          {downgraded ? (
            <Note tone="info">
              That vibe is holder-only, so we rolled a free one instead. Hold {minHold} {ticker} to use it.
            </Note>
          ) : null}
          {cat.source === "offline" ? (
            <Note tone="info">
              The writing model was unavailable, so this cat came from the sandbox composer. Roll again for a fresh
              one.
            </Note>
          ) : null}
          {saveState !== null ? <Note tone={saveState.tone}>{saveState.text}</Note> : null}
        </section>
      ) : null}

      <AdRail isHolder={isHolder} minHold={minHold} ticker={ticker} />
    </div>
  );
}

interface VibeOptionProps {
  value: string;
  label: string;
  blurb: string;
  checked: boolean;
  onSelect: () => void;
}

function VibeOption({ value, label, blurb, checked, onSelect }: VibeOptionProps): React.ReactElement {
  return (
    <label
      className={[
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
        checked ? "border-amber-400/70 bg-amber-400/15" : "border-white/12 bg-white/[0.03] hover:bg-white/[0.07]",
      ].join(" ")}
      htmlFor={`vibe-${value}`}
    >
      <input
        checked={checked}
        className="mt-0.5 size-4 shrink-0 accent-amber-400"
        id={`vibe-${value}`}
        name="vibe"
        onChange={onSelect}
        type="radio"
        value={value}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-white/55">{blurb}</span>
      </span>
    </label>
  );
}
