import { expect, type Page, test } from "@playwright/test";

// A tooltip near the window's edge slides back inside it, its caret still
// pointing at the icon, and one at the bottom of the window opens above.
// Shown tooltips, less the one the fixture opens off-screen.
const SHOWN = '.bx--tooltip--shown:not([data-testid="offscreen"] *)';

async function geometry(page: Page, name: string) {
  const trigger = page.getByRole("button", { name });
  await trigger.focus();
  const tooltip = page.locator(SHOWN).last();
  await expect(tooltip).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  return page.evaluate(
    ([name, shown]) => {
      const button = document.querySelector(`[aria-label="${name}"]`);
      const icon = (
        button?.querySelector("svg") ?? button
      )?.getBoundingClientRect();
      const tip = [...document.querySelectorAll(shown)].pop();
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
    [name, SHOWN],
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
  await page
    .getByTestId("bottom")
    .evaluate((el) => el.scrollIntoView({ block: "end" }));
  const g = await geometry(page, "At the bottom");
  expect(g.bottom).toBeLessThanOrEqual(g.height);
  expect(g.bottom).toBeLessThanOrEqual(g.iconTop);
});

// A tooltip open while it's scrolled out of view keeps `direction`.
test("a tooltip open while off-screen keeps its direction", async ({
  page,
}) => {
  await page.goto("/tooltip-edge.html");
  const tooltip = page.getByTestId("offscreen").locator(".bx--tooltip");
  await expect(tooltip).toBeAttached();
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await expect(tooltip).toHaveClass(/bx--tooltip--bottom/);
});
// A box around an in-place tooltip that would cut it off: the tooltip
// opens in a portal, whole, and the box doesn't grow a scrollbar.
for (const [box, name] of [
  ["scroll", "In a panel"],
  ["card", "In a card"],
] as const)
  test(`a tooltip ${box === "scroll" ? "in a scrolling panel" : "in a clipping card"} shows whole`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto("/tooltip-edge.html");
    await page.locator(`[aria-label="${name}"]`).focus();
    const tooltip = page.locator(SHOWN).last();
    await expect(tooltip).toBeVisible();
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    const hidden = await tooltip.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return [
        [r.left + 6, r.top + 10],
        [r.right - 6, r.top + 10],
        [r.left + 6, r.bottom - 6],
        [r.right - 6, r.bottom - 6],
      ].filter(([x, y]) => !el.contains(document.elementFromPoint(x, y)));
    });
    expect(hidden).toEqual([]);
    const scroll = await page
      .getByTestId(box)
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(scroll).toBeLessThanOrEqual(1);
  });

// The clipped tooltip moves into the portal after it first renders in
// place. Escape and hover must still work on the portalled copy.
test("Escape closes a clipped tooltip and keeps focus on its trigger", async ({
  page,
}) => {
  await page.goto("/tooltip-edge.html");
  // The fixture opens one tooltip off-screen, and Escape closes one open
  // tooltip at a time. Close it first.
  await page.keyboard.press("Escape");
  const trigger = page.locator('[aria-label="In a card"]');
  await trigger.focus();
  const portalled = page.locator(`[data-floating-portal] ${SHOWN}`);
  await expect(portalled).toBeVisible();
  await expect(page.getByTestId("card").locator(SHOWN)).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(portalled).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("a clipped tooltip opened by hover stays open over its content", async ({
  page,
}) => {
  await page.goto("/tooltip-edge.html");
  // The fixture opens one tooltip off-screen, and Escape closes one open
  // tooltip at a time. Close it first.
  await page.keyboard.press("Escape");
  const trigger = page.locator('[aria-label="In a card"]');
  await trigger.hover();
  const portalled = page.locator(`[data-floating-portal] ${SHOWN}`);
  await expect(portalled).toBeVisible();

  // The pointer crosses onto the tooltip: it stays open (WCAG 1.4.13).
  const box = await portalled.boundingBox();
  if (!box) throw new Error("no tooltip box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 5,
  });
  await page.waitForTimeout(400);
  await expect(portalled).toBeVisible();

  // Escape closes a hover-opened tooltip wherever focus is.
  await page.keyboard.press("Escape");
  await expect(portalled).toHaveCount(0);

  // Leaving the tooltip closes it.
  await trigger.hover();
  await expect(portalled).toBeVisible();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 5,
  });
  await page.mouse.move(5, 5, { steps: 5 });
  await expect(portalled).toHaveCount(0);
});
