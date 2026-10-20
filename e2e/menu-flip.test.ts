import { expect, type Locator, type Page, test } from "@playwright/test";

// A menu that doesn't fit below its trigger opens above it when there's
// more room there; one with room below still opens below.
const MENU = ".bx--list-box__menu, .bx--overflow-menu-options";

async function openBoxes(page: Page, trigger: Locator) {
  await trigger.click();
  const menu = page.locator(MENU).first();
  await expect(menu).toBeVisible();
  const [t, m] = await Promise.all([trigger.boundingBox(), menu.boundingBox()]);
  const height = await page.evaluate(
    () => document.documentElement.clientHeight,
  );
  await page.keyboard.press("Escape");
  return { t, m, height };
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 600 });
  await page.goto("/menu-flip.html");
});

for (const [name, selector] of [
  ["Dropdown", "[data-testid=bottom] .bx--dropdown .bx--list-box__field"],
  ["ComboBox", "[data-testid=bottom] .bx--combo-box input"],
  [
    "MultiSelect",
    "[data-testid=bottom] .bx--multi-select .bx--list-box__field",
  ],
  ["OverflowMenu", "[data-testid=bottom] .bx--overflow-menu"],
] as const) {
  test(`${name} at the bottom of the window opens above`, async ({ page }) => {
    await page
      .getByTestId("bottom")
      .evaluate((el) => el.scrollIntoView({ block: "end" }));
    const { t, m, height } = await openBoxes(page, page.locator(selector));
    expect(m && m.y + m.height).toBeLessThanOrEqual(height);
    expect(m && m.y + m.height).toBeLessThanOrEqual((t?.y ?? 0) + 1);
  });
}

test("a dropdown with room below opens below", async ({ page }) => {
  const trigger = page.locator("[data-testid=top] .bx--list-box__field");
  const { t, m } = await openBoxes(page, trigger);
  expect(m?.y).toBeGreaterThanOrEqual((t?.y ?? 0) + (t?.height ?? 0) - 1);
});

// A menu open while it's scrolled out of view has no window to fit, so it
// keeps `direction` rather than flipping against a window it isn't in.
test("a menu open while off-screen keeps its direction", async ({ page }) => {
  const dropdown = page.getByTestId("offscreen").locator(".bx--dropdown");
  await expect(dropdown.locator(".bx--list-box__menu")).toBeAttached();
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await expect(dropdown).not.toHaveClass(/bx--list-box--up/);
});
