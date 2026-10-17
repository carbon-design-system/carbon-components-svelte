import { expect, test } from "./helpers/host";

/**
 * A horizontal ProgressIndicator narrower than four steps stacks them as
 * the vertical one does, inside its container; wider, it stays a row.
 */
test("a narrow progress indicator stacks its steps", async ({ page }) => {
  await page.goto("/progress-fit.html");

  const steps = (id: string) =>
    page
      .getByTestId(`progress-${id}`)
      .locator(".bx--progress-step")
      .evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top), right: r.right, height: r.height };
        }),
      );

  const vertical = await steps("vertical");
  for (const id of ["200", "320"]) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one box at a time
    const stacked = await steps(id);
    const box = await page.getByTestId(`progress-${id}`).boundingBox();
    expect
      .soft(new Set(stacked.map((s) => s.top)).size, `${id} stacked`)
      .toBe(4);
    expect
      .soft(
        stacked.map((s) => Math.round(s.height)),
        `${id} as tall as vertical`,
      )
      .toEqual(vertical.map((s) => Math.round(s.height)));
    for (const s of stacked) {
      expect
        .soft(s.right, `${id} inside`)
        .toBeLessThanOrEqual((box?.x ?? 0) + (box?.width ?? 0) + 0.5);
    }
  }

  const row = await steps("600");
  expect(new Set(row.map((s) => s.top)).size).toBe(1);
});

test("a progress indicator in a flex row keeps its steps' width", async ({
  page,
}) => {
  await page.goto("/progress-fit.html");
  const list = await page
    .getByTestId("progress-flex")
    .locator(".bx--progress")
    .boundingBox();
  // Four 128px steps.
  expect(list?.width).toBeCloseTo(512, 0);
});
