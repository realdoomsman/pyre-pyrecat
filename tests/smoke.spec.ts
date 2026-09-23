import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

/**
 * The deployment manifest is the source of truth for the app's name; the page's
 * <h1> has to agree with it, so this catches a renamed app with a stale manifest
 * (or the other way round).
 */
const appName = async (): Promise<string> => {
  const manifest: unknown = JSON.parse(await readFile("pyre.manifest.json", "utf8"));
  const name = manifest !== null && typeof manifest === "object" && "name" in manifest ? manifest.name : null;
  if (typeof name !== "string" || name === "") throw new Error("pyre.manifest.json has no name");
  return name;
};

test("the home page shows the app heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(await appName());
});

test("the landing page is useful while signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("cat-fact")).not.toBeEmpty();
  await expect(page.getByTestId("generate")).toBeEnabled();

  // A second fact is one click away and must actually differ from the first.
  const first = await page.getByTestId("cat-fact").innerText();
  await page.getByRole("button", { name: "Another fact" }).click();
  await expect(page.getByTestId("cat-fact")).not.toHaveText(first);
});

test("generating a Pyrecat shows a card and adds it to the gallery", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Chaotic" }).check();
  await page.getByTestId("generate").click();

  const card = page.getByTestId("cat-card").first();
  await expect(card).toBeVisible();
  const name = (await card.getByTestId("cat-name").innerText()).trim();
  expect(name.length).toBeGreaterThan(1);
  await expect(card).toContainText("Chaotic");

  // Signed out there is no per-user shelf, so the card offers login instead of saving.
  await expect(page.getByTestId("save-login")).toBeVisible();

  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Gallery" }).click();
  await expect(page.getByTestId("gallery-list")).toContainText(name);
});

test("holder-only vibes stay locked without the coin", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("more vibes + the rare cat table")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Cosmic" })).toHaveCount(0);
});

/**
 * `<HolderGate>` reads `window.__PYRE__.tokenAddress` (from `/_pyre/env.js`) and the
 * session's `holder.balance` (from `/_pyre/me`) — both are empty/zero on the local dev
 * host, so this is the only way to exercise the unlocked branch of the gate at all.
 */
async function stubHolderSession(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/_pyre/env.js", async (route) => {
    const env = {
      appId: "local",
      slug: "local",
      chainId: 4663,
      tokenAddress: "0x000000000000000000000000000000000000f1",
      explorerUrl: "https://robinhoodchain.blockscout.com",
      googleClientId: "",
      basePath: "",
      apiOrigin: "",
      name: "Pyrecat",
      ticker: "PYRECAT",
      holderMin: "10000",
      functions: [],
    };
    await route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: `window.__PYRE__ = ${JSON.stringify(env)};`,
    });
  });
  await page.route("**/_pyre/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "holder-user", wallet: "0xabc", displayName: "Holder User" },
        holder: { isHolder: true, balance: "25000", minHold: "10000" },
      }),
    });
  });
}

test("holder-only vibes unlock for a holder session", async ({ page }) => {
  await stubHolderSession(page);
  await page.goto("/");

  await expect(page.getByText("more vibes + the rare cat table")).toHaveCount(0);
  await expect(page.getByText("Holder vibes · rare table live")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Cosmic" })).toBeVisible();

  // The dev/preview host has no real wallet, so `functions/generate.js` still sees an
  // anonymous, non-holder caller and swaps a holder-only pick for a free vibe — the UI
  // should surface that instead of pretending the roll used the requested vibe.
  await page.getByRole("radio", { name: "Cosmic" }).check();
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("cat-card").first()).toBeVisible();
  await expect(page.getByText(/holder-only, so we rolled a free one instead/)).toBeVisible();
});

test("a slow roll shows the pending state until it resolves", async ({ page }) => {
  await page.goto("/");
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_pyre/fn/generate", async (route) => {
    await held;
    await route.continue();
  });

  await page.getByTestId("generate").click();
  await expect(page.getByTestId("generate-pending")).toBeVisible();
  await expect(page.getByTestId("cat-card")).toHaveCount(0);

  release?.();
  await expect(page.getByTestId("generate-pending")).toHaveCount(0);
  await expect(page.getByTestId("cat-card").first()).toBeVisible();
});

test("My Pyrecats asks signed-out visitors to log in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: /^My Pyrecats/ }).click();
  await expect(page.getByTestId("saved-signed-out")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "My Pyrecats" })).toBeVisible();
});

test("a failed roll shows a retryable error, and retrying recovers", async ({ page }) => {
  await page.goto("/");
  let calls = 0;
  await page.route("**/_pyre/fn/generate", async (route) => {
    calls += 1;
    if (calls === 1) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "The cattery jammed." }),
      });
      return;
    }
    await route.continue();
  });

  await page.getByTestId("generate").click();
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("The cattery jammed.");

  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByTestId("cat-card")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(calls).toBe(2);
});

test("the gallery reports a load error and recovers on retry", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Gallery" }).click();

  await page.route("**/_pyre/fn/gallery", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "gallery offline" }),
    });
  });
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.getByRole("alert")).toContainText("gallery offline");

  await page.unroute("**/_pyre/fn/gallery");
  await page.getByRole("alert").getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

function stubCat(id: string, name: string, rarity: string): Record<string, unknown> {
  return {
    id,
    name,
    trait: "a stubbed trait",
    backstory: "A one-line backstory for testing.",
    vibe: "cozy",
    vibeLabel: "Cozy",
    rarity,
    holderBadge: false,
    createdAt: new Date().toISOString(),
  };
}

test("the gallery can be filtered by rarity", async ({ page }) => {
  const cats = [
    stubCat("c1", "Common One", "common"),
    stubCat("c2", "Common Two", "common"),
    stubCat("c3", "Mythic One", "mythic"),
  ];
  await page.route("**/_pyre/fn/gallery", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { cats, total: cats.length } }),
    });
  });

  await page.goto("/");
  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Gallery" }).click();

  const list = page.getByTestId("gallery-list");
  await expect(list).toContainText("Common One");
  await expect(list).toContainText("Mythic One");

  const filter = page.getByRole("group", { name: "Filter by rarity" });
  await expect(filter).toBeVisible();

  await filter.getByRole("button", { name: /^Mythic/ }).click();
  await expect(list).toContainText("Mythic One");
  await expect(list).not.toContainText("Common One");

  await filter.getByRole("button", { name: /^All/ }).click();
  await expect(list).toContainText("Common One");
  await expect(list).toContainText("Mythic One");
});

test("the rarity filter is hidden when every cat shares one rarity", async ({ page }) => {
  const cats = [stubCat("c1", "Common One", "common"), stubCat("c2", "Common Two", "common")];
  await page.route("**/_pyre/fn/gallery", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { cats, total: cats.length } }),
    });
  });

  await page.goto("/");
  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Gallery" }).click();

  await expect(page.getByTestId("gallery-list")).toContainText("Common One");
  await expect(page.getByRole("group", { name: "Filter by rarity" })).toHaveCount(0);
});

function stubMe(overrides: { isHolder?: boolean } = {}): Record<string, unknown> {
  return {
    user: { id: "test-user", wallet: null, displayName: "Test User" },
    holder: { isHolder: overrides.isHolder ?? false, balance: "0", minHold: "10000" },
    purchases: [],
  };
}

test("a signed-in visitor can save a Pyrecat and remove it from My Pyrecats", async ({ page }) => {
  let shelf: Record<string, unknown>[] = [];

  await page.route("**/_pyre/me", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stubMe()) });
  });
  await page.route("**/_pyre/fn/collection", async (route) => {
    const body = route.request().postDataJSON() as { action?: string; cat?: Record<string, unknown>; id?: string };
    if (body.action === "save" && body.cat) {
      shelf = [body.cat, ...shelf.filter((entry) => entry.id !== body.cat!.id)];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { ok: true, saved: true, cats: shelf, limit: 40 } }),
      });
      return;
    }
    if (body.action === "remove") {
      shelf = shelf.filter((entry) => entry.id !== body.id);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { ok: true, removed: true, cats: shelf, limit: 40 } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { ok: true, cats: shelf, limit: 40 } }),
    });
  });

  await page.goto("/");
  await expect(page.getByText("Signed in as Test User.")).toBeVisible();

  await page.getByTestId("generate").click();
  const card = page.getByTestId("cat-card").first();
  await expect(card).toBeVisible();
  const name = (await card.getByTestId("cat-name").innerText()).trim();

  const saveButton = page.getByTestId("save-cat");
  await saveButton.click();
  await expect(page.getByText(`${name} is now in My Pyrecats.`)).toBeVisible();
  await expect(saveButton).toBeDisabled();
  await expect(saveButton).toHaveText("Saved ✓");

  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: /^My Pyrecats/ }).click();
  const savedList = page.getByTestId("saved-list");
  await expect(savedList).toContainText(name);

  await page.getByRole("button", { name: `Remove ${name}` }).click();
  await expect(page.getByTestId("saved-empty")).toBeVisible();
});

test("a full collection reports a clear error instead of a generic one", async ({ page }) => {
  await page.route("**/_pyre/me", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stubMe()) });
  });
  await page.route("**/_pyre/fn/collection", async (route) => {
    const body = route.request().postDataJSON() as { action?: string };
    if (body.action === "save") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ result: { ok: false, reason: "full", cats: [], limit: 40 } }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ result: { ok: true, cats: [], limit: 40 } }),
    });
  });

  await page.goto("/");
  await page.getByTestId("generate").click();
  await page.getByTestId("save-cat").click();
  await expect(page.getByRole("alert")).toContainText("Your collection is full at 40 cats — remove one to make room.");
});

test("the layout fits a mobile viewport with no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("generate")).toBeVisible();
  const overflow = await page.evaluate(
    "document.documentElement.scrollWidth - document.documentElement.clientWidth",
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("Pyre apps are free — no ad slots or payment prompts appear on any tab", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary", { name: "Sponsored" })).toHaveCount(0);
  await expect(page.getByText(/ad-free/i)).toHaveCount(0);

  await page.getByTestId("generate").click();
  await expect(page.getByText(/ad-free/i)).toHaveCount(0);

  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: "Gallery" }).click();
  await expect(page.getByRole("complementary", { name: "Sponsored" })).toHaveCount(0);

  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: /^My Pyrecats/ }).click();
  await expect(page.getByRole("complementary", { name: "Sponsored" })).toHaveCount(0);
});
