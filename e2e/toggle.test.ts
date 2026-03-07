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
    await toggle.click();
    await expect(toggle).toBeChecked();
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const wrapper = page.getByTestId("toggle-notifications");
    await expect(wrapper).toBeVisible();
    const toggle = wrapper.getByRole("switch");
    await toggle.click();
    await expect(toggle).toBeChecked();
  });

  test("disabled toggle cannot be toggled", async ({ page }) => {
    const toggle = page.getByRole("switch", { name: "Disabled toggle" });
    await expect(toggle).toBeDisabled();
  });
});
