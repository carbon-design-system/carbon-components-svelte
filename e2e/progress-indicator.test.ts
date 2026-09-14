import { expect, test } from "@playwright/test";

test.describe("ProgressIndicator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/progress-indicator.html");
  });

  test("renders progress indicator", async ({ page }) => {
    await expect(page.getByTestId("progress-indicator")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /First step/ }),
    ).toBeVisible();
  });

  test("displays all steps", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /First step/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Second step/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Third step/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Fourth step/ }),
    ).toBeVisible();
  });

  test("clicking step navigates to it", async ({ page }) => {
    await page.getByRole("button", { name: /Third step/ }).click();
    await expect(page.getByTestId("current-index")).toHaveAttribute(
      "data-current",
      "2",
    );
  });

  test("shows the same focus outline on unclickable and clickable steps", async ({
    page,
  }) => {
    const outlineOf = (locator: ReturnType<typeof page.getByRole>) =>
      locator.evaluate((el) => getComputedStyle(el).outline);

    // First step is current, so it's unclickable; second step is complete
    // and not current, so it's clickable.
    const currentStep = page.getByRole("button", { name: /First step/ });
    const clickableStep = page.getByRole("button", { name: /Second step/ });

    await currentStep.focus();
    const currentOutline = await outlineOf(currentStep);
    expect(currentOutline).not.toContain("none");

    await clickableStep.focus();
    const clickableOutline = await outlineOf(clickableStep);
    expect(clickableOutline).not.toContain("none");

    expect(clickableOutline).toBe(currentOutline);
  });
});
