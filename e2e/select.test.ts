import { expect, test } from "./helpers/host";

test.describe("Select", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/select.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Country")).toBeVisible();
  });

  // Hovering a fluid field tints only the field; the divider under it
  // hides meanwhile, as fluid list boxes' does, rather than sitting a
  // pixel below the tint.
  test("hides a fluid invalid select's divider while the field is hovered", async ({
    page,
  }) => {
    const box = page.getByTestId("fluid-invalid");
    const divider = box.locator(".bx--select__divider");
    const color = () =>
      divider.evaluate((el) => getComputedStyle(el).borderBottomColor);

    expect(await color()).not.toBe("rgba(0, 0, 0, 0)");
    await box.locator("select").hover();
    await expect.poll(color).toBe("rgba(0, 0, 0, 0)");
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const select = page.getByLabel("Country");
    await expect(select).toBeVisible();
    await select.selectOption("Canada");
    await expect(page.getByTestId("selected-value")).toContainText("ca");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const select = page.getByTestId("select-country");
    await expect(select).toBeVisible();
    await select.selectOption({ label: "United Kingdom" });
    await expect(page.getByTestId("selected-value")).toContainText("uk");
  });

  test("selects option", async ({ page }) => {
    await page.getByLabel("Country").selectOption("Germany");
    await expect(page.getByTestId("selected-value")).toContainText("de");
  });
});
