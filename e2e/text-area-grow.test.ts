import { expect, test } from "@playwright/test";

test.describe("TextArea grow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-area-grow.html");
  });

  test("grows past the rows minimum without clipping content", async ({
    page,
  }) => {
    const textarea = page.getByTestId("grow-rows");
    const { scrollHeight, clientHeight } = await textarea.evaluate(
      (el: HTMLTextAreaElement) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }),
    );

    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
  });

  test("caps growth at maxRows and scrolls the overflow", async ({ page }) => {
    const textarea = page.getByTestId("grow-max-rows");
    const { rows, overflowY } = await textarea.evaluate(
      (el: HTMLTextAreaElement) => {
        const computed = getComputedStyle(el);
        const paddingTop = Number.parseFloat(computed.paddingTop);
        const paddingBottom = Number.parseFloat(computed.paddingBottom);
        const lineHeight = Number.parseFloat(computed.lineHeight);
        return {
          rows: (el.clientHeight - paddingTop - paddingBottom) / lineHeight,
          overflowY: computed.overflowY,
        };
      },
    );

    expect(Math.abs(rows - 8)).toBeLessThan(0.1);
    expect(overflowY).toBe("auto");
  });

  test("grows taller when a narrower container rewraps a long line", async ({
    page,
  }) => {
    const textarea = page.getByTestId("grow-width");
    const heightBefore = await textarea.evaluate(
      (el: HTMLTextAreaElement) => el.clientHeight,
    );

    await page.evaluate(() => {
      const container = document.getElementById("width-container");
      if (container) container.style.width = "200px";
    });

    await expect
      .poll(() =>
        textarea.evaluate((el: HTMLTextAreaElement) => el.clientHeight),
      )
      .toBeGreaterThan(heightBefore);
  });
});
