import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("SidePanel a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/side-panel.html?header");
    const dialog = page.getByRole("dialog", { name: "Edit deployment" });
    await expect(dialog).toBeVisible();

    // Step 1, with the back button, label, subtitle, resize handle and
    // footer actions.
    const openResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(openResults.violations).toEqual([]);

    // In RTL the parts swap sides; names and roles stay the same.
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const rtlResults = await new AxeBuilder({ page }).include("#app").analyze();
    expect(rtlResults.violations).toEqual([]);
  });

  test("has no violations with header actions and an AI label", async ({
    page,
  }) => {
    await page.goto("/side-panel-header-actions.html");
    await expect(page.getByRole("dialog")).toBeVisible();
    // Contrast reads the colors mid-fade while the panel slides in.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
