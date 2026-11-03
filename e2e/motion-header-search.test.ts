import { expect, type Page, test } from "./helpers/host";

const MENUS = ["results", "rich"] as const;

/** The animations that run on a menu or inside it. */
const animationCount = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) =>
          (animation.effect as KeyframeEffect | null)?.target?.closest(
            "[id$='-menu']",
          ),
        ).length,
  );

const animatedProperties = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) =>
        (animation.effect as KeyframeEffect | null)?.target?.closest(
          "[id$='-menu']",
        ),
      )
      .flatMap((animation) =>
        (animation.effect as KeyframeEffect)
          .getKeyframes()
          .flatMap((keyframe) => Object.keys(keyframe)),
      ),
  );

/** Open one of the searches, and let the entrance end. */
async function openSearch(page: Page, name: (typeof MENUS)[number]) {
  await page.goto("/motion-header-search.html");
  await page.locator(`#${name} .bx--header-search-button`).first().click();
  await expect(page.locator(`#${name}-menu`)).toBeVisible();
  await expect.poll(() => animationCount(page)).toBe(0);
}

const clear = (page: Page, name: (typeof MENUS)[number]) =>
  page.locator(`#${name}`).getByRole("button", { name: "Clear search input" });

for (const name of MENUS) {
  test.describe(`Motion on the ${name} header search menu`, () => {
    test("slides out, then removes the menu", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await openSearch(page, name);
      const menu = page.locator(`#${name}-menu`);

      await clear(page, name).click();

      await expect.poll(() => animatedProperties(page)).toContain("height");
      const properties = await animatedProperties(page);
      expect(properties).toContain("height");
      expect(properties).toContain("opacity");
      for (const property of properties) {
        expect(property).toMatch(
          /^(offset|easing|composite|computedOffset|opacity|transform|overflow|height|(padding|margin|border)(Top|Bottom)(Width)?)$/,
        );
      }
      await expect(menu).toBeVisible();
      expect(await menu.evaluate((node) => (node as HTMLElement).inert)).toBe(
        true,
      );
      await expect(
        page.locator(`#${name}`).getByRole("button", { name: /^Search/ }),
      ).toHaveAttribute("aria-expanded", "false");

      await expect(menu).toHaveCount(0);
    });

    test("removes the menu at once under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openSearch(page, name);

      await clear(page, name).click();

      await expect(page.locator(`#${name}-menu`)).toHaveCount(0, {
        timeout: 100,
      });
      expect(await animationCount(page)).toBe(0);
    });
  });
}
