import { useEffect, useState } from "react";
import { HolderGate } from "@pyre/app-sdk/react";
import { Button, Card, Chip } from "../components";
import { CatCard } from "../CatCard";
import type { GenerateResult, Pyrecat } from "../types";
import { VIBES } from "../vibes";
import { Note, Spinner } from "../ui";

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

  // If holder status is lost mid-session, a holder-only vibe can no longer be selected —
  // fall back to a free one so a radio is always checked.
  useEffect(() => {
    if (!isHolder && HOLDER_VIBES.some((option) => option.key === vibe)) {
      setVibe("cozy");
    }
  }, [isHolder, vibe]);

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
      <Card
        description="Pick a vibe and the cattery writes a name, a personality quirk and a one-line backstory."
        title="Roll a new Pyrecat"
      >
        <fieldset>
          <legend className="font-mono text-xs font-semibold tracking-wide text-ink-faint uppercase">Vibe</legend>
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
              <div className="mt-4 rounded-card border border-dashed border-border-strong p-4">
                <p className="text-sm font-medium text-ink">
                  {HOLDER_VIBES.length} more vibes + the rare cat table
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {HOLDER_VIBES.map((option) => (
                    <li key={option.key}>
                      <Chip>{option.label}</Chip>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-faint">
                  Hold {minHold} {ticker} to unlock these vibes, roll Rare and Mythic cats, and stamp a holder badge
                  on everything you save.
                </p>
              </div>
            }
          >
            <div className="mt-4 rounded-card border border-violet/35 bg-violet-soft p-4">
              <p className="font-mono text-xs font-semibold tracking-wide text-violet uppercase">
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
          <Button data-testid="generate" disabled={running} onClick={() => void run()} type="button">
            {running ? <Spinner label="Consulting the cattery…" /> : "Generate a Pyrecat"}
          </Button>
          {cat !== null && !running ? (
            <span className="text-xs text-ink-faint">Roll again for a new one.</span>
          ) : null}
        </div>

        {error !== null ? (
          <div className="mt-4">
            <Note onRetry={() => void run()} tone="error">
              {error}
            </Note>
          </div>
        ) : null}
      </Card>

      {running && cat === null ? (
        <Card data-testid="generate-pending">
          <p className="text-sm text-ink-muted">
            <Spinner label="Naming your cat…" />
          </p>
        </Card>
      ) : null}

      {cat !== null ? (
        <section aria-labelledby="result-heading" aria-live="polite" className="flex flex-col gap-3">
          <h2 className="sr-only" id="result-heading">
            Your Pyrecat
          </h2>
          <CatCard
            action={
              loggedIn ? (
                <Button
                  data-testid="save-cat"
                  disabled={saving || alreadySaved}
                  onClick={() => void save()}
                  type="button"
                  variant="secondary"
                >
                  {saving ? <Spinner label="Saving…" /> : alreadySaved ? "Saved ✓" : "Save to My Pyrecats"}
                </Button>
              ) : (
                <Button data-testid="save-login" onClick={() => void onLogin()} type="button" variant="secondary">
                  Log in to save this cat
                </Button>
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
        "flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors",
        checked ? "border-violet/50 bg-violet-soft" : "border-border bg-surface hover:border-border-strong",
      ].join(" ")}
      htmlFor={`vibe-${value}`}
    >
      <input
        checked={checked}
        className="mt-0.5 size-4 shrink-0 accent-violet"
        id={`vibe-${value}`}
        name="vibe"
        onChange={onSelect}
        type="radio"
        value={value}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-ink-muted">{blurb}</span>
      </span>
    </label>
  );
}
