import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("RadioButtonGroup a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/radio-button-group.html");
    await expect(page.getByTestId("radio-group-choice")).toBeVisible();

    const staticResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(staticResults.violations).toEqual([]);

    await page.getByRole("radio", { name: "Option Two" }).click({
      force: true,
    });
    await expect(page.getByTestId("selected-value")).toHaveText(
      "Selected: two",
    );

    const selectedResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(selectedResults.violations).toEqual([]);
  });
});
