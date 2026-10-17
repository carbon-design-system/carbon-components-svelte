import { expect, test } from "./helpers/host";

test.describe("Select", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/select.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Country")).toBeVisible();
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

  // Helper text goes under an inline field, where the invalid and warning
  // messages it alternates with go, not beside it.
  test("puts an inline select's helper text under the field", async ({
    page,
  }) => {
    const box = page.getByTestId("inline-helper");
    const field = await box.locator(".bx--select-input").boundingBox();
    const helper = await box.locator(".bx--form__helper-text").boundingBox();
    expect(helper?.y).toBeGreaterThanOrEqual(
      (field?.y ?? 0) + (field?.height ?? 0),
    );
    expect(helper?.x).toBeCloseTo(field?.x ?? 0, 0);
  });

  // The label stays centred on the field, whatever goes under it.
  for (const id of [
    "inline-helper",
    "inline-invalid",
    "inline-warning",
    "inline-sm",
  ]) {
    test(`centres an inline select's label on the field (${id})`, async ({
      page,
    }) => {
      const box = page.getByTestId(id);
      const center = (r: { y: number; height: number } | null) =>
        (r?.y ?? 0) + (r?.height ?? 0) / 2;
      const label = await box.locator(".bx--label").boundingBox();
      const field = await box.locator(".bx--select-input").boundingBox();
      expect(Math.abs(center(label) - center(field))).toBeLessThanOrEqual(1);
    });
  }
});
