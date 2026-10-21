import { expect, test } from "./helpers/host";

test.describe("AILabel in a data table column header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ai-label-data-table.html");
  });

  test("opens toward the table instead of past its edge", async ({ page }) => {
    const table = page.getByTestId("table");
    const content = table.locator(".bx--data-table-content");
    await table.locator("th .bx--ai-label .bx--toggletip-button").click();

    const popover = table.locator("th .bx--popover--open");
    await expect(popover).toHaveClass(/bx--popover--bottom-right/);
    const overflow = await content.evaluate(
      (el) => el.scrollWidth - el.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test("keeps its caret on the label", async ({ page }) => {
    const table = page.getByTestId("table");
    const button = table.locator("th .bx--ai-label .bx--toggletip-button");
    await button.click();

    const offset = await button.evaluate((btn) => {
      const contents = btn
        .closest(".bx--toggletip")
        ?.querySelector(".bx--popover-contents");
      if (!contents) return Number.NaN;
      const caret = getComputedStyle(contents, "::after");
      const box = contents.getBoundingClientRect();
      const right = Number.parseFloat(caret.right);
      const shift = new DOMMatrix(caret.transform).e;
      const border = Number.parseFloat(
        getComputedStyle(contents).borderRightWidth,
      );
      const center =
        box.right - border - right + shift - Number.parseFloat(caret.width) / 2;
      const b = btn.getBoundingClientRect();
      return Math.abs(center - (b.left + b.width / 2));
    });
    expect(offset).toBeLessThan(1);
  });

  test("gives the AI column's cells the AI gradient", async ({ page }) => {
    const cells = page.locator("td.bx--table-cell--column-ai-label");
    await expect(cells).toHaveCount(2);
    const image = await cells
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(image).toContain("linear-gradient");
  });
});
