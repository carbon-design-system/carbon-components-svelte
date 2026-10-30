import { expect, test } from "./helpers/host";

test("a read-only NumberInput without steppers keeps its icon clear of the decorator", async ({
  page,
}) => {
  await page.goto("/number-input-readonly-decorator.html");
  await page.evaluate(() => document.fonts.ready);

  for (const size of ["xs", "sm", "md", "xl"]) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one field at a time
    const boxes = await page.getByTestId(size).evaluate((cell) => {
      const edge = (selector: string) => {
        const r = cell.querySelector(selector)?.getBoundingClientRect();
        return r ? { left: r.left, right: r.right } : null;
      };
      const input = cell.querySelector("input");
      if (!input) return null;
      const style = getComputedStyle(input);
      const box = input.getBoundingClientRect();
      return {
        icon: edge(".bx--text-input__readonly-icon"),
        decorator: edge(".bx--field-decorator"),
        // Where the input's text area ends.
        textEnd:
          box.right -
          Number.parseFloat(style.paddingRight) -
          Number.parseFloat(style.borderRightWidth),
      };
    });
    if (!boxes?.icon || !boxes.decorator) throw new Error(`No icon: ${size}`);
    expect
      .soft(boxes.icon.right, size)
      .toBeLessThanOrEqual(boxes.decorator.left);
    expect.soft(boxes.textEnd, size).toBeLessThanOrEqual(boxes.icon.left);
  }
});
