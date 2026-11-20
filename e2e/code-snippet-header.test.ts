import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("CodeSnippet header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/code-snippet-header.html");
  });

  const files = (page: import("@playwright/test").Page) =>
    page.getByTestId("snippet-files");

  test("has no detectable accessibility violations", async ({ page }) => {
    const before = await new AxeBuilder({ page }).include("#app").analyze();
    expect(before.violations).toEqual([]);

    await files(page).getByRole("tab", { name: "long.txt" }).click();
    await files(page).getByRole("button", { name: "Show more" }).click();
    const after = await new AxeBuilder({ page }).include("#app").analyze();
    expect(after.violations).toEqual([]);
  });

  test("names the code by its title or its tab", async ({ page }) => {
    await expect(
      page.getByTestId("snippet-title").getByRole("textbox"),
    ).toHaveAccessibleName("src/App.svelte");
    await expect(files(page).getByRole("tabpanel")).toHaveAccessibleName(
      "App.svelte",
    );
  });

  test("selects a file with the arrow keys and leaves the tab stop on it", async ({
    page,
  }) => {
    const tabs = files(page).getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(files(page).getByRole("tabpanel")).toContainText("new App(");
    await expect(page.getByTestId("changes")).toHaveText("main.ts");

    // Tab leaves the strip for the panel.
    await page.keyboard.press("Tab");
    await expect(files(page).getByRole("tabpanel")).toBeFocused();
  });

  test("flips the arrow keys in right-to-left, with the chrome", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const tabs = files(page).getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toBeFocused();
    // The first tab is at the inline start, the right; the code stays left to right.
    const [first, second] = await Promise.all([
      tabs.first().boundingBox(),
      tabs.nth(1).boundingBox(),
    ]);
    expect(first?.x).toBeGreaterThan(second?.x ?? Number.POSITIVE_INFINITY);
    expect(
      await files(page)
        .getByRole("tabpanel")
        .evaluate((panel) => getComputedStyle(panel).direction),
    ).toBe("ltr");
  });

  test("offers the expand control for the selected file's rows", async ({
    page,
  }) => {
    const more = files(page).getByRole("button", { name: "Show more" });
    await expect(more).toHaveCount(0);
    await files(page).getByRole("tab", { name: "long.txt" }).click();
    await expect(more).toBeVisible();
    await files(page).getByRole("tab", { name: "App.svelte" }).click();
    await expect(more).toHaveCount(0);
  });

  test("colors each file in its own language through the syntax subpackage", async ({
    page,
  }) => {
    const supported = await page.evaluate(() => "highlights" in CSS);
    test.skip(!supported, "No CSS Custom Highlight API");
    const sizes = () =>
      page.evaluate(() => ({
        definition: CSS.highlights.get("syntax-definition-keyword")?.size ?? 0,
        property: CSS.highlights.get("syntax-property-name")?.size ?? 0,
      }));
    await expect.poll(sizes).toEqual({ definition: 1, property: 0 });
    await page
      .getByTestId("snippet-syntax")
      .getByRole("tab", { name: "style.css" })
      .click();
    await expect.poll(sizes).toEqual({ definition: 0, property: 1 });
  });

  test("keeps the copy button inside the header", async ({ page }) => {
    const [header, copy] = await Promise.all([
      files(page).locator(".bx--snippet__header").boundingBox(),
      files(page).locator(".bx--copy-btn").boundingBox(),
    ]);
    expect(copy?.y).toBeGreaterThanOrEqual(header?.y ?? 0);
    expect((copy?.y ?? 0) + (copy?.height ?? 0)).toBeLessThanOrEqual(
      (header?.y ?? 0) + (header?.height ?? 0),
    );
  });

  test("marks the selected tab by more than color in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const [selected, other] = await Promise.all([
      files(page)
        .getByRole("tab", { name: "App.svelte" })
        .evaluate((tab) => getComputedStyle(tab).borderBlockEndWidth),
      files(page)
        .getByRole("tab", { name: "main.ts" })
        .evaluate((tab) => getComputedStyle(tab).borderBlockEndWidth),
    ]);
    expect([selected, other]).toEqual(["2px", "0px"]);
  });
});
