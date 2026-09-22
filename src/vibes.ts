import type { Rarity } from "./types";

export interface Vibe {
  key: string;
  label: string;
  blurb: string;
  holderOnly: boolean;
}

/** Keys must match `VIBES` in `functions/generate.js`, which enforces `holderOnly`. */
export const VIBES: Vibe[] = [
  { key: "cozy", label: "Cozy", blurb: "Radiators and laundry piles", holderOnly: false },
  { key: "chaotic", label: "Chaotic", blurb: "Gremlin energy at 3am", holderOnly: false },
  { key: "heroic", label: "Heroic", blurb: "Tiny courage, doomed quests", holderOnly: false },
  { key: "cosmic", label: "Cosmic", blurb: "Naps measured in light-years", holderOnly: true },
  { key: "cursed", label: "Cursed", blurb: "Haunted, but still funny", holderOnly: true },
  { key: "neon", label: "Neon", blurb: "Chrome claws, small data heists", holderOnly: true },
  { key: "ancient", label: "Ancient", blurb: "Temples and sacred long naps", holderOnly: true },
];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  mythic: "Mythic",
};

/** Tailwind classes per rarity, built from the Pyre theme tokens — no off-palette colours. */
export const RARITY_CHIP: Record<Rarity, string> = {
  common: "border-border bg-surface text-ink-muted",
  uncommon: "border-violet/35 bg-violet-soft text-violet",
  rare: "border-heat-4/40 bg-heat-1 text-heat-5",
  mythic: "border-heat-3/50 bg-heat-2/60 text-heat-6",
};
