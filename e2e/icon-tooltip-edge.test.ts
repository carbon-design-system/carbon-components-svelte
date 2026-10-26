import { expect, type Locator, type Page, test } from "./helpers/host";

// A portalled icon or definition tooltip at the window's edge slides back
// inside it, and its caret still points at the trigger.
const TRIGGERS = {
  Button: ".bx--btn",
  TooltipIcon: ".bx--tooltip__trigger",
  TooltipDefinition: ".bx--tooltip__trigger",
} as const;

async function geometry(page: Page, trigger: Locator) {
  await trigger.focus();
  const tooltip = page.locator(".bx--tooltip-portal");
  await expect(tooltip).toBeVisible();
  // The tooltip slides a frame after the portal places it.
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  const [content, caret, anchor] = await Promise.all(
    [
      tooltip.locator(".bx--tooltip-portal__content"),
      tooltip.locator(".bx--tooltip-portal__caret"),
      trigger,
    ].map((locator) =>
      locator.evaluate((el) => {
        const { left, right } = el.getBoundingClientRect();
        return { left, right, center: (left + right) / 2 };
      }),
    ),
  );
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  return { content, caret, anchor, width };
}

for (const dir of ["ltr", "rtl"] as const) {
  test(`portalled icon tooltips stay in the window (${dir})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 700 });
    await page.goto("/icon-tooltip-edge.html");
    await page.evaluate((dir) => {
      document.documentElement.dir = dir;
    }, dir);
    await page.evaluate(() => document.fonts.ready);

    for (const [name, selector] of Object.entries(TRIGGERS)) {
      for (const edge of ["start", "end"]) {
        const label = `${name} at the ${edge} edge`;
        const trigger = page
          .getByTestId(`${name}-${edge}`)
          .locator(selector)
          .first();
        // biome-ignore lint/performance/noAwaitInLoops: one tooltip opens at a time.
        const g = await geometry(page, trigger);
        expect.soft(g.content.left, label).toBeGreaterThanOrEqual(0);
        expect.soft(g.content.right, label).toBeLessThanOrEqual(g.width);
        expect
          .soft(Math.abs(g.caret.center - g.anchor.center), label)
          .toBeLessThan(2);
        await trigger.blur();
        await expect(page.locator(".bx--tooltip-portal")).toHaveCount(0);
      }
    }
  });
}
