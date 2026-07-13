import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("UIShell a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/uishell.html");
    await expect(page.getByTestId("main-paragraph")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Profile" }).click();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();

    const profileMenuResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(profileMenuResults.violations).toEqual([]);

    await page.getByRole("menuitem", { name: "Submenu" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Sub link one" }),
    ).toBeVisible();

    const headerNavResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(headerNavResults.violations).toEqual([]);
  });
});
