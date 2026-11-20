import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("JsonViewer a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/json-viewer.html?data=types&expand=2");
    await expect(page.getByRole("tree", { name: "JSON" })).toBeVisible();

    const collapsed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(collapsed.violations).toEqual([]);

    await page.getByRole("searchbox").fill("ab");
    await expect(page.locator(".bx--json-viewer__mark").first()).toBeVisible();

    const searched = await new AxeBuilder({ page }).include("#app").analyze();
    expect(searched.violations).toEqual([]);

    await page.getByRole("button", { name: "Expand all" }).click();
    await page.getByLabel("JSON").first().focus();
    const expanded = await new AxeBuilder({ page }).include("#app").analyze();
    expect(expanded.violations).toEqual([]);
  });

  test("has no violations with types shown", async ({ page }) => {
    await page.goto("/json-viewer.html?data=basic&expand=3&types");
    await expect(page.getByRole("tree", { name: "JSON" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no violations in Gray 100", async ({ page }) => {
    await page.goto("/json-viewer.html?data=types&expand=2&types");
    // Axe reads colors, so let the theme's color transitions finish first.
    await page.evaluate(async () => {
      document.documentElement.classList.add("bx--g100");
      await Promise.all(document.getAnimations().map((a) => a.finished));
    });
    await expect(page.getByRole("tree", { name: "JSON" })).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
