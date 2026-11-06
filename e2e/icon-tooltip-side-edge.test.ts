import { expect, test } from "./helpers/host";

// A portalled tooltip beside its trigger, at the top or bottom edge of the
// window, slides back inside it, and its caret still points at the trigger.
const TRIGGERS = {
  Button: ".bx--btn",
  TooltipIcon: ".bx--tooltip__trigger",
} as const;

for (const name of Object.keys(TRIGGERS) as (keyof typeof TRIGGERS)[]) {
  for (const edge of ["top", "bottom"]) {
    test(`${name} tooltip beside its trigger stays in the window (${edge})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 900, height: 700 });
      await page.goto("/icon-tooltip-side-edge.html");
      await page.evaluate(() => document.fonts.ready);

      const trigger = page
        .getByTestId(`${name}-${edge}`)
        .locator(TRIGGERS[name])
        .first();
      await trigger.focus();
      const tooltip = page.locator(".bx--tooltip-portal");
      await expect(tooltip).toBeVisible();
      // The tooltip slides a frame after the portal places it.
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );

      const [content, caret, anchor] = await Promise.all(
        [
          tooltip.locator(".bx--tooltip-portal__content"),
          tooltip.locator(".bx--tooltip-portal__caret"),
          trigger,
        ].map((locator) =>
          locator.evaluate((el) => {
            const { top, bottom } = el.getBoundingClientRect();
            return { top, bottom, center: (top + bottom) / 2 };
          }),
        ),
      );
      const height = await page.evaluate(
        () => document.documentElement.clientHeight,
      );

      expect(Math.abs(caret.center - anchor.center)).toBeLessThan(2);
      // The caret stays 1rem inside the box, as Carbon places a start- or
      // end-aligned caret, not in its corner.
      expect(caret.center - content.top).toBeGreaterThanOrEqual(15.5);
      expect(content.bottom - caret.center).toBeGreaterThanOrEqual(15.5);
      // The box stays in the window, except where that inset needs it to
      // reach past the edge.
      const overTop = Math.max(0, 16 - caret.center);
      const overBottom = Math.max(0, caret.center + 16 - height);
      expect(content.top).toBeGreaterThanOrEqual(-overTop - 0.5);
      expect(content.bottom).toBeLessThanOrEqual(height + overBottom + 0.5);
    });
  }
}
