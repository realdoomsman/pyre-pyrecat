import { useId } from "react";
import type { Rarity } from "./types";

/**
 * Procedurally drawn cat portrait. Every visual choice — coat, pattern, eye colour,
 * ear tufts — is derived from a hash of the cat's name, so the same Pyrecat always
 * looks the same and no image ever has to be fetched. Rarity picks the palette.
 */

const COATS: Record<Rarity, string[]> = {
  common: ["#c2703d", "#8b8f98", "#4a4643", "#d9b98d", "#6f6257"],
  uncommon: ["#4d7c6f", "#8a6f4d", "#6d5a8a", "#a8703f"],
  rare: ["#2f7396", "#7b3f8f", "#1f7a5e", "#b8452f"],
  mythic: ["#c08a10", "#c2185b", "#0fa3a3", "#7b52d9"],
};

const EYES = ["#f5d90a", "#34d399", "#60a5fa", "#f472b6", "#dbeafe", "#bef264"];

const PATTERNS = ["solid", "tabby", "patch", "spots", "tuxedo"] as const;

/** FNV-1a with an extra rotate — the rotate is what stops similar names sharing a coat. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** mulberry32 — tiny deterministic PRNG so the portrait is stable across renders. */
function rng(seed: number): () => number {
  let state = seed;
  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // The first few draws inherit bias from the seed; discard them so coats spread evenly.
  next();
  next();
  next();
  return next;
}

function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const mix = (channel: number): number =>
    Math.max(0, Math.min(255, Math.round(channel + (amount > 0 ? (255 - channel) * amount : channel * amount))));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export interface CatAvatarProps {
  name: string;
  rarity?: Rarity;
  className?: string;
}

export function CatAvatar({ name, rarity = "common", className }: CatAvatarProps): React.ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const next = rng(hash(`${name}|${rarity}`));

  // `?? …` only satisfies noUncheckedIndexedAccess; the tables above are never empty.
  const palette = COATS[rarity];
  const coat = palette[Math.floor(next() * palette.length)] ?? "#c2703d";
  const eye = EYES[Math.floor(next() * EYES.length)] ?? "#f5d90a";
  const pattern = PATTERNS[Math.floor(next() * PATTERNS.length)] ?? "solid";
  const dark = shade(coat, -0.42);
  const light = shade(coat, 0.3);
  const tilt = Math.round(next() * 10 - 5);
  const pupil = 1.6 + next() * 1.4;

  const headClip = `head-${uid}`;
  const bgId = `bg-${uid}`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient cx="30%" cy="18%" id={bgId} r="95%">
          <stop offset="0%" stopColor={shade(coat, 0.18)} stopOpacity="0.55" />
          <stop offset="100%" stopColor="#120d0a" stopOpacity="0.95" />
        </radialGradient>
        <clipPath id={headClip}>
          <ellipse cx="50" cy="57" rx="30" ry="26" />
        </clipPath>
      </defs>

      <rect fill={`url(#${bgId})`} height="100" rx="18" width="100" x="0" y="0" />

      {rarity === "mythic" ? (
        <g fill={light} opacity="0.8">
          <path d="M14 20 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8z" />
          <path d="M86 14 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3z" />
          <path d="M88 76 l1.1 2.7 2.7 1.1 -2.7 1.1 -1.1 2.7 -1.1 -2.7 -2.7 -1.1 2.7 -1.1z" />
        </g>
      ) : null}

      <g transform={`rotate(${tilt} 50 60)`}>
        {/* ears */}
        <polygon fill={coat} points="21,44 25,11 48,33" />
        <polygon fill={coat} points="79,44 75,11 52,33" />
        <polygon fill={shade(coat, 0.45)} points="26,40 29,20 41,33" opacity="0.85" />
        <polygon fill={shade(coat, 0.45)} points="74,40 71,20 59,33" opacity="0.85" />

        {/* head */}
        <ellipse cx="50" cy="57" fill={coat} rx="30" ry="26" />

        <g clipPath={`url(#${headClip})`}>
          {pattern === "tabby" ? (
            <g fill="none" stroke={dark} strokeLinecap="round" strokeWidth="3.4" opacity="0.75">
              <path d="M41 37 q9 7 18 0" />
              <path d="M38 44 q12 8 24 0" />
              <path d="M22 54 h10" />
              <path d="M68 54 h10" />
              <path d="M24 64 h9" />
              <path d="M67 64 h9" />
            </g>
          ) : null}
          {pattern === "patch" ? (
            <ellipse cx="34" cy="48" fill={dark} opacity="0.7" rx="17" ry="19" transform="rotate(-14 34 48)" />
          ) : null}
          {pattern === "spots" ? (
            <g fill={dark} opacity="0.6">
              <circle cx="30" cy="45" r="4.4" />
              <circle cx="70" cy="48" r="3.6" />
              <circle cx="38" cy="72" r="3.2" />
              <circle cx="63" cy="73" r="4" />
              <circle cx="50" cy="38" r="3" />
            </g>
          ) : null}
          {pattern === "tuxedo" ? (
            <ellipse cx="50" cy="78" fill={light} opacity="0.9" rx="20" ry="14" />
          ) : null}
        </g>

        {/* muzzle */}
        <ellipse cx="50" cy="69" fill={light} opacity={pattern === "tuxedo" ? 0.55 : 0.75} rx="13" ry="9" />

        {/* eyes */}
        <ellipse cx="39" cy="55" fill="#12100e" rx="7.4" ry="8.2" opacity="0.35" />
        <ellipse cx="61" cy="55" fill="#12100e" rx="7.4" ry="8.2" opacity="0.35" />
        <ellipse cx="39" cy="55" fill={eye} rx="6.4" ry="7.2" />
        <ellipse cx="61" cy="55" fill={eye} rx="6.4" ry="7.2" />
        <ellipse cx="39" cy="55" fill="#0b0a09" rx={pupil} ry="6.6" />
        <ellipse cx="61" cy="55" fill="#0b0a09" rx={pupil} ry="6.6" />
        <circle cx="36.8" cy="52" fill="#ffffff" opacity="0.85" r="1.5" />
        <circle cx="58.8" cy="52" fill="#ffffff" opacity="0.85" r="1.5" />

        {/* nose + mouth */}
        <path d="M46 64 L54 64 L50 69 Z" fill="#e88a97" />
        <path
          d="M50 69 q-5 5.5 -9.5 1.5 M50 69 q5 5.5 9.5 1.5"
          fill="none"
          stroke={dark}
          strokeLinecap="round"
          strokeWidth="2"
        />

        {/* whiskers */}
        <g fill="none" opacity="0.7" stroke={light} strokeLinecap="round" strokeWidth="1.6">
          <path d="M38 67 L14 62" />
          <path d="M38 70 L13 71" />
          <path d="M62 67 L86 62" />
          <path d="M62 70 L87 71" />
        </g>
      </g>
    </svg>
  );
}
