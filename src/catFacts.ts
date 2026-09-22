/** Static cat facts for the daily card — bundled, because the app may not call the network. */
export const CAT_FACTS: string[] = [
  "A cat's nose print is as unique as a human fingerprint.",
  "Cats have 32 muscles in each ear, which is why they can swivel them independently.",
  "A group of cats is a clowder; a group of kittens is a kindle.",
  "Domestic cats sleep 12–16 hours a day, mostly in short naps.",
  "Cats sweat through their paw pads, which is why nervous cats leave damp prints.",
  "A cat's purr sits between 25 and 150 Hz, a range linked to tissue healing.",
  "Adult cats have 30 teeth — four fewer than dogs.",
  "Cats walk by moving both legs on one side at a time, like camels and giraffes.",
  "Most cats are lactose intolerant as adults, so milk is a bad treat.",
  "A cat's whiskers are roughly as wide as its body, and work as a gap gauge.",
  "Cats can rotate their ears 180 degrees and hear up to about 64 kHz.",
  "The oldest known pet cat was buried with a human in Cyprus 9,500 years ago.",
  "Cats have a third eyelid, the nictitating membrane, that sweeps the eye clean.",
  "A cat's tail holds about 10 percent of all the bones in its body.",
  "Cats do not have a sweet tooth — they lack a working sweet taste receptor.",
  "Kittens' eyes are blue at birth and usually change colour by about seven weeks.",
  "Cats right themselves mid-fall using a vestibular reflex, not their tail.",
  "A slow blink from a cat is a genuine signal of trust; try returning it.",
  "House cats can sprint at roughly 30 mph over short distances.",
  "Cats knead with their paws as kittens to stimulate milk, and keep the habit for comfort.",
  "Whiskers grow above the eyes, on the chin and on the backs of the front legs too.",
  "Cats mark territory by rubbing their cheeks — those glands leave a scent you cannot smell.",
];

/** Same fact for everyone, all day — a shared "daily" without any server round trip. */
export function factOfTheDay(date: Date = new Date()): number {
  const days = Math.floor(date.getTime() / 86_400_000);
  return ((days % CAT_FACTS.length) + CAT_FACTS.length) % CAT_FACTS.length;
}
