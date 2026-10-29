import { expect, test } from "./helpers/host";

test.describe("TextArea grow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-area-grow.html");
  });

  test("grows past the rows minimum without clipping content", async ({
    page,
  }) => {
    const textarea = page.getByTestId("grow-rows");
    // The textarea grows after it mounts, so poll until it fits its content.
    await expect
      .poll(() =>
        textarea.evaluate(
          (el: HTMLTextAreaElement) => el.scrollHeight - el.clientHeight,
        ),
      )
      .toBeLessThanOrEqual(0);
  });

  test("caps growth at maxRows and scrolls the overflow", async ({ page }) => {
    const textarea = page.getByTestId("grow-max-rows");
    const measure = () =>
      textarea.evaluate((el: HTMLTextAreaElement) => {
        const computed = getComputedStyle(el);
        const paddingTop = Number.parseFloat(computed.paddingTop);
        const paddingBottom = Number.parseFloat(computed.paddingBottom);
        const lineHeight = Number.parseFloat(computed.lineHeight);
        return {
          rows: (el.clientHeight - paddingTop - paddingBottom) / lineHeight,
          overflowY: computed.overflowY,
        };
      });

    // The textarea grows after it mounts, so poll until it reaches the cap.
    await expect
      .poll(async () => Math.abs((await measure()).rows - 8))
      .toBeLessThan(0.1);
    expect((await measure()).overflowY).toBe("auto");
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
