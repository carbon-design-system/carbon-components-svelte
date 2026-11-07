import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Card a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/card.html");

    // A static card with actions, and clickable link, button and disabled
    // cards, each named by its title.
    await expect(
      page.getByRole("link", { name: "Usage forecast" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Project settings" }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    // The footer's overflow menu, open.
    await page.getByRole("button", { name: "More options" }).click();
    await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);
  });
});
