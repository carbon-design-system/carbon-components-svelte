import { expect, type Page, test } from "./helpers/host";

const style = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate(
      (el, prop) => getComputedStyle(el).getPropertyValue(prop),
      property,
    );

// The zones: Gray 100 outside, Gray 10 nested in it.
const G100 = { background: "rgb(22, 22, 22)", layer: "rgb(38, 38, 38)" };
const G10 = { background: "rgb(244, 244, 244)", layer: "rgb(255, 255, 255)" };

for (const pageTheme of ["white", "g100"]) {
  test.describe(`ThemeZone on a ${pageTheme} page`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/theme-zone.html?page=${pageTheme}`);
      await expect(page.getByTestId("inner")).toBeVisible();
    });

    test("paints each zone in its own theme", async ({ page }) => {
      const outer = page.getByTestId("outer");
      const inner = page.getByTestId("inner");
      await expect(outer).toHaveCSS("background-color", G100.background);
      await expect(outer).toHaveCSS("color", "rgb(244, 244, 244)");
      await expect(outer).toHaveCSS("color-scheme", "dark");
      await expect(inner).toHaveCSS("background-color", G10.background);
      await expect(inner).toHaveCSS("color", "rgb(22, 22, 22)");
      await expect(inner).toHaveCSS("color-scheme", "light");
    });

    test("gives the components inside the zone's tokens", async ({ page }) => {
      // field-01: g100 #262626, g10 #ffffff; a Layer steps to field-02.
      await expect(page.getByLabel("Outer field")).toHaveCSS(
        "background-color",
        "rgb(38, 38, 38)",
      );
      await expect(page.getByLabel("Inner field")).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
      await expect(page.getByLabel("Inner layer field")).toHaveCSS(
        "background-color",
        "rgb(244, 244, 244)",
      );
      expect(
        await style(page, '[data-testid="inner"]', "--cds-text-primary"),
      ).toBe("#161616");
    });

    test("keeps a portalled menu in its zone's theme", async ({ page }) => {
      const openMenu = async (name: string, layer: string) => {
        await page.getByRole("combobox", { name }).click();
        const listbox = page.getByRole("listbox");
        await expect(listbox).toBeVisible();
        await expect(page.locator("body > [data-portal]")).toHaveCount(1);
        await expect(listbox).toHaveCSS("background-color", layer);
        await page.keyboard.press("Escape");
        await expect(listbox).toBeHidden();
      };
      await openMenu("Outer region", G100.layer);
      await openMenu("Inner region", G10.layer);
    });
  });
}
