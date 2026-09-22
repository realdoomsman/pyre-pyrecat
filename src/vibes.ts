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

/** Tailwind classes per rarity — kept literal so the JIT compiler sees them. */
export const RARITY_CHIP: Record<Rarity, string> = {
  common: "border-stone-500/40 bg-stone-500/10 text-stone-200",
  uncommon: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  rare: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  mythic: "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-200",
};
