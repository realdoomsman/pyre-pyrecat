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

test("My Pyrecats asks signed-out visitors to log in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Sections" }).getByRole("button", { name: /^My Pyrecats/ }).click();
  await expect(page.getByTestId("saved-signed-out")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "My Pyrecats" })).toBeVisible();
});
