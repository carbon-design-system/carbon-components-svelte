import { expect, test } from "./helpers/host";

/**
 * An ActionSet narrower than 10rem a button stacks its buttons, primary
 * first, rather than squeezing their labels to a letter a line. Wider, the
 * buttons share one row. `disableStacking` keeps the row.
 */
const layout = (page, testId: string) =>
  page
    .getByTestId(testId)
    .locator(".bx--btn")
    .evaluateAll((buttons) => {
      const setWidth = buttons[0].parentElement?.getBoundingClientRect().width;
      const boxes = buttons.map((b) => b.getBoundingClientRect());
      const order = [...buttons]
        .sort(
          (a, b) =>
            a.getBoundingClientRect().top - b.getBoundingClientRect().top,
        )
        .map((b) => b.textContent?.trim());
      return {
        rows: new Set(boxes.map((b) => Math.round(b.top))).size,
        fullWidth: boxes.every(
          (b) => Math.round(b.width) === Math.round(setWidth ?? 0),
        ),
        first: order[0],
      };
    });

test("a narrow ActionSet stacks its buttons, primary first", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/action-set-fit.html");
  // Two buttons stack below 20rem, so 320px still holds them in a row.
  for (const [count, width] of [
    [2, 240],
    [3, 320],
    [4, 320],
  ]) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one set at a time
    const narrow = await layout(page, `set-${count}-${width}`);
    expect.soft(narrow, `${count} at ${width}px`).toEqual({
      rows: count,
      fullWidth: true,
      first: "Save",
    });
  }
  expect.soft((await layout(page, "set-2-320")).rows, "2 at 320px").toBe(1);
  for (const count of [2, 3, 4]) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one set at a time
    const wide = await layout(page, `set-${count}-1000`);
    expect.soft(wide.rows, `${count} at 1000px`).toBe(1);
  }
  expect((await layout(page, "set-fixed-320")).rows).toBe(1);
});
