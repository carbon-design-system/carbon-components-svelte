import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const states = [
  "state=groups",
  "state=groups&query=re",
  "state=noresults",
  "state=empty",
  "state=loading-more",
  "state=long",
  "state=groups&rtl",
];

test.describe("CommandPalette a11y", () => {
  for (const state of states) {
    test(`has no detectable accessibility violations: ${state}`, async ({
      page,
    }) => {
      await page.goto(`/command-palette.html?open&${state}`);
      await expect(page.locator(".bx--command-palette--open")).toBeVisible();
      await expect(page.getByRole("combobox")).toBeFocused();

      const results = await new AxeBuilder({ page })
        .include(".bx--command-palette")
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("has no violations after the highlight moves", async ({ page }) => {
    await page.goto("/command-palette.html?open&state=groups");
    await expect(page.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");

    const results = await new AxeBuilder({ page })
      .include(".bx--command-palette")
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
