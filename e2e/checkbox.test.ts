import { expect, test } from "./helpers/host";

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
    await checkbox.click({ force: true });
    await expect(checkbox).toBeChecked();
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const wrapper = page.getByTestId("checkbox-agree");
    await expect(wrapper).toBeVisible();
    const checkbox = wrapper.getByRole("checkbox");
    await checkbox.click({ force: true });
    await expect(checkbox).toBeChecked();
  });

  test("disabled checkbox cannot be toggled", async ({ page }) => {
    const checkbox = page.getByRole("checkbox", { name: "Disabled option" });
    await expect(checkbox).toBeDisabled();
  });

  // Server markup can carry `checked` but not `indeterminate`, so the label
  // is marked mixed until hydration; it still has to draw the dash.
  test("a checked, indeterminate box draws the dash before hydration", async ({
    page,
  }) => {
    const label = page.getByTestId("checkbox-mixed").locator("label");
    await page
      .getByTestId("checkbox-mixed")
      .locator("input")
      .evaluate((input: HTMLInputElement) => {
        input.indeterminate = false;
      });
    await expect(label).toHaveAttribute(
      "data-contained-checkbox-state",
      "mixed",
    );
    expect(
      await label.evaluate((el) => getComputedStyle(el, "::after").transform),
    ).toBe("matrix(1, 0, 0, 1, 0, 0)");
  });

  test.describe("noMargin", () => {
    test("has no outer margin", async ({ page }) => {
      const wrapper = page
        .getByTestId("checkbox-row")
        .locator(".bx--checkbox-wrapper");
      await expect(wrapper).toHaveCSS("margin-top", "0px");
      await expect(wrapper).toHaveCSS("margin-bottom", "0px");
    });
  });
});
