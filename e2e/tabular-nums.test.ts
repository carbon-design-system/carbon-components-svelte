import { expect, test } from "./helpers/host";

// Proportional digits differ in width, so a changing number shifts the
// text around it. Each of these draws its numbers in tabular figures.
test("changing numbers use tabular figures", async ({ page }) => {
  await page.goto("/tabular-nums.html");
  const selectors = [
    ".bx--relative-time",
    ".bx--pagination__items-count",
    ".bx--pagination__right .bx--pagination__text",
    ".bx--pagination--simple .bx--pagination__text",
    ".bx--big-number__value",
    ".bx--big-number__denominator",
    ".bx--big-number__delta-value",
    ".bx--progress-bar__value-text",
  ];
  const read = await page.evaluate(
    (selectors) =>
      selectors.map((selector) => {
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el).fontVariantNumeric : "missing";
      }),
    selectors,
  );
  for (const [index, selector] of selectors.entries()) {
    expect.soft(read[index], selector).toBe("tabular-nums");
  }
});
