/**
 * Server function: a signed-in user's saved Pyrecats ("My Pyrecats").
 *
 * The collection lives in app-scope storage under a key derived from the verified
 * `ship.user.id`, so a caller can only ever read or write their own shelf. The holder
 * badge is stamped from `ship.user.isHolder` at save time — it is never taken from input.
 *
 * Actions: `list` (default), `save`, `remove`.
 *
 * @param {{ action?: unknown, cat?: unknown, id?: unknown }} input
 * @param {{
 *   user: { id: string | null, wallet: string | null, isHolder: boolean },
 *   kv: { get(key: string): Promise<unknown>, set(key: string, value: unknown): Promise<void>, del(key: string): Promise<void> },
 * }} ship
 */

/** 64KB per value; ~300 bytes per cat leaves plenty of headroom at 40. */
const MAX_SAVED = 40;

const RARITIES = ["common", "uncommon", "rare", "mythic"];

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function userKey(id) {
  const safe = id.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 100);
  return `saved.u.${safe}`;
}

function normalise(raw) {
  if (!raw || typeof raw !== "object") return null;
  const entry = /** @type {Record<string, unknown>} */ (raw);
  const name = clean(entry.name, 40);
  if (name === "") return null;
  return {
    id: typeof entry.id === "string" && entry.id !== "" ? entry.id : `legacy-${name}`,
    name,
    trait: clean(entry.trait, 60),
    backstory: clean(entry.backstory, 180),
    vibe: typeof entry.vibe === "string" ? entry.vibe.slice(0, 20) : "cozy",
    vibeLabel: clean(entry.vibeLabel, 20) || "Cozy",
    rarity: RARITIES.indexOf(entry.rarity) >= 0 ? entry.rarity : "common",
    holderBadge: entry.holderBadge === true,
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : "",
  };
}

async function read(ship, key) {
  try {
    const stored = await ship.kv.get(key);
    if (!Array.isArray(stored)) return [];
    return stored.map(normalise).filter((entry) => entry !== null);
  } catch {
    return [];
  }
}

export default async function handler(input, ship) {
  const userId = typeof ship.user?.id === "string" && ship.user.id !== "" ? ship.user.id : null;
  if (userId === null) {
    return { ok: false, reason: "auth", cats: [], limit: MAX_SAVED };
  }

  const key = userKey(userId);
  const action = typeof input?.action === "string" ? input.action : "list";

  if (action === "save") {
    const cat = normalise(input?.cat);
    if (cat === null) {
      return { ok: false, reason: "invalid", cats: await read(ship, key), limit: MAX_SAVED };
    }
    const cats = await read(ship, key);
    if (cats.some((entry) => entry.id === cat.id)) {
      return { ok: true, saved: false, reason: "duplicate", cats, limit: MAX_SAVED };
    }
    if (cats.length >= MAX_SAVED) {
      return { ok: false, reason: "full", cats, limit: MAX_SAVED };
    }
    // Holder status is re-checked server-side: the badge means "held the coin when saved".
    cat.holderBadge = ship.user.isHolder === true;
    cat.savedAt = new Date().toISOString();
    cats.unshift(cat);
    await ship.kv.set(key, cats);
    return { ok: true, saved: true, cats, limit: MAX_SAVED };
  }

  if (action === "remove") {
    const id = typeof input?.id === "string" ? input.id : "";
    const cats = await read(ship, key);
    const kept = cats.filter((entry) => entry.id !== id);
    if (kept.length === cats.length) {
      return { ok: true, removed: false, cats, limit: MAX_SAVED };
    }
    if (kept.length === 0) await ship.kv.del(key);
    else await ship.kv.set(key, kept);
    return { ok: true, removed: true, cats: kept, limit: MAX_SAVED };
  }

  return { ok: true, cats: await read(ship, key), limit: MAX_SAVED };
}
