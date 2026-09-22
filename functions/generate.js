/**
 * Server function: invents one Pyrecat persona and records it in the public gallery.
 *
 * Runs in the platform sandbox (QuickJS, no imports, no network). Everything that a
 * caller could lie about — whether they are a holder, which vibes and rarities they
 * may roll — is decided here from `ship.user.isHolder`, never from the request body.
 *
 * @param {{ vibe?: unknown }} input
 * @param {{
 *   user: { id: string | null, wallet: string | null, isHolder: boolean },
 *   kv: { get(key: string): Promise<unknown>, set(key: string, value: unknown): Promise<void> },
 *   llm(prompt: string, opts?: { maxTokens?: number }): Promise<unknown>,
 * }} ship
 */

const GALLERY_KEY = "gallery.recent";
const COUNTER_KEY = "gallery.count";
const GALLERY_SIZE = 20;

/** Keys must match `VIBES` in `src/vibes.ts`; `holderOnly` is enforced here, not there. */
const VIBES = {
  cozy: { label: "Cozy", holderOnly: false, hint: "radiators, laundry piles, gently absurd domestic bliss" },
  chaotic: { label: "Chaotic", holderOnly: false, hint: "gremlin energy, 3am parkour, knocking things off shelves" },
  heroic: { label: "Heroic", holderOnly: false, hint: "tiny courage, doomed quests, guarding the hallway" },
  cosmic: { label: "Cosmic", holderOnly: true, hint: "star charts, nebulae, naps measured in light-years" },
  cursed: { label: "Cursed", holderOnly: true, hint: "gothic and haunted, faintly ominous but still funny" },
  neon: { label: "Neon", holderOnly: true, hint: "cyberpunk alleys, chrome claws, small-time data heists" },
  ancient: { label: "Ancient", holderOnly: true, hint: "temples, dynasties, sacred and extremely long naps" },
};

const FREE_VIBES = ["cozy", "chaotic", "heroic"];

/** Seed words steer the model away from the same three cat names every call. */
const SEEDS = [
  "brass doorknob", "storm drain", "burnt toast", "velvet curtain", "fire escape", "copper kettle",
  "lost sock", "night bus", "greenhouse", "vinyl record", "fishmonger", "lighthouse",
  "laundromat", "cinnamon", "scaffolding", "tide pool", "church bell", "pawn shop",
  "radiator pipe", "paper lantern", "gravel yard", "dumpling stall", "observatory", "tram stop",
  "sourdough", "thunderhead", "rooftop aerial", "peppermint", "harbour crane", "attic beam",
  "marmalade", "static hiss", "cobblestone", "moth wing", "kerosene", "ferry deck",
];

const RARITIES = ["common", "uncommon", "rare", "mythic"];

/** Offline composer — used when `ship.llm` is unavailable or returns something unusable. */
const NAME_A = [
  "Biscuit", "Marmalade", "Soot", "Pickle", "Thimble", "Waffle", "Clove", "Bandit", "Noodle", "Ember",
  "Pumpernickel", "Tuna", "Gravy", "Mochi", "Rusty", "Saffron", "Winston", "Olive", "Doorbell", "Cinder",
];
const NAME_B = [
  "Vanderclaw", "Pawsworth", "McSnoot", "of the Fire Escape", "Mittenhide", "Thunderpaw", "Fluffington",
  "Nightsocks", "Bumblecoat", "Featherbite", "Grumbleton", "Yarnbreaker", "Tailwind", "Snackwell",
];
const TRAITS = [
  "professionally unimpressed", "believes doors are optional", "hoards bottle caps", "narrates his own naps",
  "afraid of one specific chair", "negotiates for second breakfast", "sits only in squares of sunlight",
  "reviews every cardboard box", "purrs in the wrong key", "collects lost earrings", "fights her own tail",
  "guards the fridge at night", "refuses to be carried", "sleeps in the sink on purpose", "suspicious of rain",
];
const STORY = [
  "Was found asleep in a {seed} and has refused to explain himself since.",
  "Traded a {seed} for a lifetime of tuna and calls it a fair deal.",
  "Once held a {seed} hostage for eleven minutes of undivided attention.",
  "Claims to have been born under a {seed} during a thunderstorm.",
  "Retired from guarding a {seed} to pursue a career in sitting down.",
  "Escaped a {seed} twice and now fears absolutely nothing except the vacuum.",
  "Keeps a list of everyone who ever walked past the {seed} without stopping.",
  "Learned to open latches near a {seed} and has been a problem ever since.",
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Holders roll on a better table; everyone else tops out at uncommon. */
function rollRarity(isHolder) {
  const roll = Math.random();
  if (!isHolder) return roll < 0.82 ? "common" : "uncommon";
  if (roll < 0.44) return "common";
  if (roll < 0.74) return "uncommon";
  if (roll < 0.93) return "rare";
  return "mythic";
}

function fallbackCat(vibeKey) {
  const seed = pick(SEEDS);
  return {
    name: `${pick(NAME_A)} ${pick(NAME_B)}`,
    trait: pick(TRAITS),
    backstory: pick(STORY).replace("{seed}", seed),
    vibe: vibeKey,
  };
}

/** `ship.llm` may hand back a string or a wrapper object; accept either. */
function llmText(raw) {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const box = /** @type {Record<string, unknown>} */ (raw);
    for (const field of ["text", "output", "content", "completion", "result"]) {
      if (typeof box[field] === "string") return /** @type {string} */ (box[field]);
    }
  }
  return "";
}

function parseCat(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const name = clean(parsed.name, 40);
  const trait = clean(parsed.trait, 60);
  const backstory = clean(parsed.backstory, 180);
  if (name.length < 2 || trait.length < 3 || backstory.length < 10) return null;
  return { name, trait, backstory };
}

function buildPrompt(vibe, rarity) {
  const seeds = [pick(SEEDS), pick(SEEDS), pick(SEEDS)].join(", ");
  return [
    "Invent one fictional cat mascot for an online community called Pyrecat.",
    `Vibe: ${vibe.label} — ${vibe.hint}.`,
    `Rarity: ${rarity} (rarer cats should feel stranger and more specific, never grander in wording).`,
    `Loose inspiration, do not quote these literally: ${seeds}.`,
    "",
    'Reply with ONLY minified JSON: {"name":"...","trait":"...","backstory":"..."}',
    "- name: 1-3 words, sounds like a real cat name, puns welcome, no numbering",
    "- trait: 2-6 words, one concrete personality quirk, lowercase",
    "- backstory: exactly one sentence, at most 18 words, concrete and funny, no emoji",
    "Avoid the words whiskers, shadow, luna, mittens, midnight and legendary.",
  ].join("\n");
}

export default async function handler(input, ship) {
  const isHolder = ship.user?.isHolder === true;

  const requested = typeof input?.vibe === "string" ? input.vibe : "";
  let vibeKey = Object.prototype.hasOwnProperty.call(VIBES, requested) ? requested : pick(FREE_VIBES);
  let downgraded = false;
  if (VIBES[vibeKey].holderOnly && !isHolder) {
    vibeKey = pick(FREE_VIBES);
    downgraded = true;
  }
  const vibe = VIBES[vibeKey];
  const rarity = rollRarity(isHolder);

  let cat = null;
  let source = "llm";
  try {
    cat = parseCat(llmText(await ship.llm(buildPrompt(vibe, rarity), { maxTokens: 220 })));
  } catch {
    cat = null;
  }
  if (!cat) {
    cat = fallbackCat(vibeKey);
    source = "offline";
  }

  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1679616).toString(36)}`;
  const pyrecat = {
    id,
    name: cat.name,
    trait: cat.trait,
    backstory: cat.backstory,
    vibe: vibeKey,
    vibeLabel: vibe.label,
    rarity: RARITIES.indexOf(rarity) >= 0 ? rarity : "common",
    holderBadge: isHolder,
    createdAt: new Date().toISOString(),
    source,
  };

  // Public gallery: newest first, capped at 20 so the 64KB value limit is never in play.
  let recent = [];
  try {
    const stored = await ship.kv.get(GALLERY_KEY);
    if (Array.isArray(stored)) recent = stored.filter((entry) => entry && typeof entry === "object");
  } catch {
    recent = [];
  }
  recent.unshift(pyrecat);
  let counted = 0;
  try {
    const stored = await ship.kv.get(COUNTER_KEY);
    if (typeof stored === "number" && Number.isFinite(stored)) counted = stored;
  } catch {
    counted = 0;
  }
  const total = counted + 1;
  try {
    await ship.kv.set(GALLERY_KEY, recent.slice(0, GALLERY_SIZE));
    await ship.kv.set(COUNTER_KEY, total);
  } catch {
    // A full gallery must never cost the caller their cat — they still get the result.
  }

  return { cat: pyrecat, downgraded, total, rareTableUnlocked: isHolder };
}
