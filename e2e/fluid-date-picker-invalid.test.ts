import { expect, test } from "./helpers/host";

/**
 * A fluid single date picker's invalid outline is drawn once. The wrapper and
 * the container inside it sit on boxes a pixel apart, so outlining both drew
 * two red lines along the bottom edge. A 1px divider separates the field from
 * its message, as in the warn state.
 */
test("a fluid invalid date picker draws one outline and a divider", async ({
  page,
}) => {
  await page.goto("/fluid-date-picker.html");

  const picker = page.getByTestId("fluid-date-picker-single-invalid");
  const outlined = await picker.evaluate((root) =>
    [root, ...root.querySelectorAll("*")]
      .map((el) => {
        const { outlineStyle, outlineWidth } = getComputedStyle(el);
        return { cls: el.className, outlineStyle, outlineWidth };
      })
      .filter(
        (el) =>
          el.outlineStyle !== "none" && Number.parseFloat(el.outlineWidth),
      ),
  );
  expect.soft(outlined).toHaveLength(1);

  const divider = await picker
    .locator(".bx--date-picker__input")
    .evaluate((el) => {
      const { borderBlockEndStyle, borderBlockEndWidth } = getComputedStyle(el);
      return `${borderBlockEndWidth} ${borderBlockEndStyle}`;
    });
  expect(divider).toBe("1px solid");
});
