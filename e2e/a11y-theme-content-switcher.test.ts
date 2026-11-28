import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("ThemeContentSwitcher a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/theme-content-switcher.html");
    const switcher = page.getByRole("tablist", { name: "Themes" });
    await expect(switcher).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await switcher.getByRole("tab", { name: "Gray 100" }).click();
    await expect(page.getByTestId("theme")).toHaveText("g100");
    await expect(page.locator("html")).toHaveAttribute("theme", "g100");
    await expect(
      page
        .getByRole("tablist", { name: "Color scheme" })
        .getByRole("tab", { name: "Gray 100" }),
    ).toHaveAttribute("aria-selected", "true");

    const switchedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(switchedResults.violations).toEqual([]);
  });
});
