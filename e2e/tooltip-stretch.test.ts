import { expect, test } from "./helpers/host";

test("keeps a stretching Stack from widening tooltip triggers", async ({
  page,
}) => {
  await page.goto("/tooltip-stretch.html");
  await page.evaluate(() => document.fonts.ready);

  const widths = await page.evaluate(() => {
    const width = (testId: string) =>
      document
        .querySelector(`[data-testid="${testId}"]`)
        ?.getBoundingClientRect().width ?? Number.NaN;
    return {
      stack: width("stack"),
      definition: width("tooltip-definition"),
      icon: width("tooltip-icon"),
    };
  });

  // Stretched, a trigger matched the Stack's width, and its tooltip
  // centered on that box instead of the term or icon.
  expect.soft(widths.definition).toBeLessThan(widths.stack / 2);
  expect.soft(widths.icon).toBeLessThan(widths.stack / 2);
});
