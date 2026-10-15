import { expect, test } from "@playwright/test";

test.describe("Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toggle.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(
      page.getByRole("switch", { name: "Enable notifications" }),
    ).toBeVisible();
  });

  test("can be located by getByRole when labelText is set", async ({
    page,
  }) => {
    const toggle = page.getByRole("switch", { name: "Enable notifications" });
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await page
      .getByTestId("toggle-notifications")
      .locator("label.bx--toggle-input__label")
      .click();
    await expect(toggle).toBeChecked();
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const wrapper = page.getByTestId("toggle-notifications");
    await expect(wrapper).toBeVisible();
    const toggle = wrapper.getByRole("switch");
    await wrapper.locator("label.bx--toggle-input__label").click();
    await expect(toggle).toBeChecked();
  });

  test("disabled toggle cannot be toggled", async ({ page }) => {
    const toggle = page.getByRole("switch", { name: "Disabled toggle" });
    await expect(toggle).toBeDisabled();
  });

  test("lays the state text out inside the toggle's box", async ({ page }) => {
    const row = page.getByTestId("toggle-row");
    const textRight = await row
      .locator(".bx--toggle__text--off")
      .evaluate((node) => node.getBoundingClientRect().right);
    const neighborLeft = await page
      .getByTestId("toggle-row-neighbor")
      .evaluate((node) => node.getBoundingClientRect().left);

    expect(textRight).toBeLessThanOrEqual(neighborLeft);
  });

  test("keeps its width when the state flips", async ({ page }) => {
    const toggle = page.getByTestId("toggle-row").locator(".bx--form-item");
    const before = (await toggle.boundingBox())?.width ?? 0;
    await page.getByTestId("toggle-row").getByText("Paused").click();
    await expect(
      page.getByRole("switch", { name: "Live prices" }),
    ).toBeChecked();
    const after = (await toggle.boundingBox())?.width ?? 0;

    expect(before).toBeGreaterThan(48);
    expect(after).toBe(before);
  });
});
