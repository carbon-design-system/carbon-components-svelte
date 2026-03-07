import { expect, test } from "@playwright/test";

test.describe("Checkbox", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/checkbox.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(
      page.getByRole("checkbox", { name: "I agree to the terms" }),
    ).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const checkbox = page.getByRole("checkbox", {
      name: "I agree to the terms",
    });
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const wrapper = page.getByTestId("checkbox-agree");
    await expect(wrapper).toBeVisible();
    const checkbox = wrapper.getByRole("checkbox");
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test("disabled checkbox cannot be toggled", async ({ page }) => {
    const checkbox = page.getByRole("checkbox", { name: "Disabled option" });
    await expect(checkbox).toBeDisabled();
  });
});
