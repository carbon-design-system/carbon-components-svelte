import { expect, test } from "./helpers/host";

// The switcher fits its switches when every Switch sets `icon`. CSS reads
// the set with `:has()`, so no class waits on the switches registering.
const measure = (page, id: string) =>
  page.getByTestId(id).evaluate((el) => ({
    width: el.getBoundingClientRect().width,
    parent: el.parentElement.getBoundingClientRect().width,
    switches: [...el.querySelectorAll(".bx--content-switcher-btn")].map(
      (b) => b.getBoundingClientRect().width,
    ),
  }));

test.describe("ContentSwitcher icon-only", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/content-switcher-icon-only.html");
  });

  for (const id of ["default", "sm", "xl"]) {
    test(`fits its icon switches (${id})`, async ({ page }) => {
      const switcher = page.getByTestId(id);
      const square = Number(await switcher.getAttribute("data-switch-width"));
      const { width, switches } = await measure(page, id);

      for (const w of switches) expect(w).toBeCloseTo(square, 0);
      expect(width).toBeCloseTo(square * switches.length, 0);
      await expect(switcher).not.toHaveClass(/--icon-only/);
    });
  }

  test("spans its container when one switch has text", async ({ page }) => {
    const { width, parent } = await measure(page, "mixed");
    expect(width).toBeCloseTo(parent, 0);
  });

  test("refits when a switch gains or loses its icon", async ({ page }) => {
    expect((await measure(page, "toggled")).width).toBeCloseTo(120, 0);

    await page.getByTestId("toggle-icon").click();
    const spread = await measure(page, "toggled");
    expect(spread.width).toBeCloseTo(spread.parent, 0);

    await page.getByTestId("toggle-icon").click();
    expect((await measure(page, "toggled")).width).toBeCloseTo(120, 0);
  });
});
