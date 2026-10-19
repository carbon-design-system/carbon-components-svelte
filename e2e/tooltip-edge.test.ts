import { expect, type Page, test } from "@playwright/test";

// A tooltip near the window's edge slides back inside it, its caret still
// pointing at the icon, and one at the bottom of the window opens above.
async function geometry(page: Page, name: string) {
  const trigger = page.getByRole("button", { name });
  await trigger.focus();
  const tooltip = page.locator(".bx--tooltip--shown").last();
  await expect(tooltip).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  return page.evaluate(
    ([name]) => {
      const button = document.querySelector(`[aria-label="${name}"]`);
      const icon = (
        button?.querySelector("svg") ?? button
      )?.getBoundingClientRect();
      const tip = [...document.querySelectorAll(".bx--tooltip--shown")].pop();
      const box = tip?.getBoundingClientRect();
      const caret = tip
        ?.querySelector(".bx--tooltip__caret")
        ?.getBoundingClientRect();
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        left: box?.left ?? 0,
        right: box?.right ?? 0,
        top: box?.top ?? 0,
        bottom: box?.bottom ?? 0,
        iconCenter: icon ? icon.left + icon.width / 2 : 0,
        iconTop: icon?.top ?? 0,
        caretCenter: caret ? caret.left + caret.width / 2 : 0,
      };
    },
    [name],
  );
}

// In right-to-left, the fixture's row ends at the window's left edge.
for (const [dir, edge] of [
  ["ltr", "right"],
  ["rtl", "left"],
] as const) {
  for (const name of ["In place", "Portalled"]) {
    test(`${name} tooltip at the ${edge} edge stays in the window`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 900, height: 600 });
      await page.goto("/tooltip-edge.html");
      await page.evaluate((d) => {
        document.documentElement.dir = d;
      }, dir);
      const g = await geometry(page, name);
      expect(g.right).toBeLessThanOrEqual(g.width);
      expect(g.left).toBeGreaterThanOrEqual(0);
      expect(Math.abs(g.caretCenter - g.iconCenter)).toBeLessThan(3);
    });
  }
}

test("a tooltip at the bottom of the window opens above", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto("/tooltip-edge.html");
  await page.getByTestId("bottom").scrollIntoViewIfNeeded();
  const g = await geometry(page, "At the bottom");
  expect(g.bottom).toBeLessThanOrEqual(g.height);
  expect(g.bottom).toBeLessThanOrEqual(g.iconTop);
});
