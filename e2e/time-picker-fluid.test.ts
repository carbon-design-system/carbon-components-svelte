import { expect, test } from "./helpers/host";

/**
 * A fluid TimePicker splits its row by how many parts it has: with two
 * selects, the input and first select share half and the second takes
 * the rest; with one, the input and select take half each. The layout
 * comes from CSS alone, so server markup matches the hydrated picker.
 */
test("a fluid time picker splits its row by its parts", async ({ page }) => {
  await page.goto("/time-picker-fluid.html");

  const shares = (id: string) =>
    page
      .getByTestId(id)
      .locator(".bx--time-picker--fluid__wrapper > *")
      .evaluateAll((parts) => {
        const total = parts.reduce(
          (n, p) => n + p.getBoundingClientRect().width,
          0,
        );
        return parts.map((p) =>
          Math.round((p.getBoundingClientRect().width / total) * 100),
        );
      });

  expect(await shares("one-select")).toEqual([50, 50]);
  expect(await shares("two-selects")).toEqual([25, 25, 50]);
});
