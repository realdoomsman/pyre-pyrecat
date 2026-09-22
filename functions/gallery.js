/**
 * Server function: the public gallery — the 20 most recently generated Pyrecats.
 *
 * Read-only and anonymous-friendly, so the landing page renders with no login.
 *
 * @param {unknown} _input
 * @param {{ kv: { get(key: string): Promise<unknown> } }} ship
 */

const GALLERY_KEY = "gallery.recent";
const COUNTER_KEY = "gallery.count";
const GALLERY_SIZE = 20;

const RARITIES = ["common", "uncommon", "rare", "mythic"];

/** Reshapes a stored entry so an old or partial record can never break the UI. */
function normalise(raw) {
  if (!raw || typeof raw !== "object") return null;
  const entry = /** @type {Record<string, unknown>} */ (raw);
  const name = typeof entry.name === "string" ? entry.name.slice(0, 40) : "";
  if (name === "") return null;
  return {
    id: typeof entry.id === "string" && entry.id !== "" ? entry.id : `legacy-${name}`,
    name,
    trait: typeof entry.trait === "string" ? entry.trait.slice(0, 60) : "",
    backstory: typeof entry.backstory === "string" ? entry.backstory.slice(0, 180) : "",
    vibe: typeof entry.vibe === "string" ? entry.vibe : "cozy",
    vibeLabel: typeof entry.vibeLabel === "string" ? entry.vibeLabel : "Cozy",
    rarity: RARITIES.indexOf(entry.rarity) >= 0 ? entry.rarity : "common",
    holderBadge: entry.holderBadge === true,
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : "",
  };
}

export default async function handler(_input, ship) {
  let cats = [];
  try {
    const stored = await ship.kv.get(GALLERY_KEY);
    if (Array.isArray(stored)) {
      cats = stored.map(normalise).filter((entry) => entry !== null).slice(0, GALLERY_SIZE);
    }
  } catch {
    cats = [];
  }

  let total = cats.length;
  try {
    const stored = await ship.kv.get(COUNTER_KEY);
    if (typeof stored === "number" && Number.isFinite(stored)) total = stored;
  } catch {
    total = cats.length;
  }

  return { cats, total };
}
