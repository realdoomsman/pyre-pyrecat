/** Shapes returned by `functions/*.js`. */

export type Rarity = "common" | "uncommon" | "rare" | "mythic";

export interface Pyrecat {
  id: string;
  name: string;
  trait: string;
  backstory: string;
  vibe: string;
  vibeLabel: string;
  rarity: Rarity;
  holderBadge: boolean;
  createdAt: string;
  /** `"llm"` when the model wrote it, `"offline"` when the sandbox composer did. */
  source?: "llm" | "offline";
  savedAt?: string;
}

export interface GenerateResult {
  cat: Pyrecat;
  /** True when a holder-only vibe was requested without the coin and swapped for a free one. */
  downgraded: boolean;
  total: number;
  rareTableUnlocked: boolean;
}

export interface GalleryResult {
  cats: Pyrecat[];
  total: number;
}

export interface CollectionResult {
  ok: boolean;
  cats: Pyrecat[];
  limit: number;
  reason?: "auth" | "invalid" | "full" | "duplicate";
  saved?: boolean;
  removed?: boolean;
}
