import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Dialog a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/dialog.html");

    await page.getByTestId("open-modal").click();
    await expect(page.getByTestId("modal-focus-target")).toBeVisible();

    const modalResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(modalResults.violations).toEqual([]);

    // Native <dialog> closes on Escape by default; close the modal before
    // opening the non-modal one, since a modal dialog blocks interaction
    // with everything outside it.
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("modal-focus-target")).toBeHidden();

    await page.getByTestId("open-non-modal").click();
    await expect(page.getByText("Non-modal content")).toBeVisible();

    const nonModalResults = await new AxeBuilder({ page })
      .include("#app")
      .analyze();
    expect(nonModalResults.violations).toEqual([]);
  });
});
