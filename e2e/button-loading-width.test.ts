import { expect, test } from "./helpers/host";

const kinds = ["primary", "ghost", "danger-ghost"];
const sizes = ["xs", "small", "field", "default", "lg", "xl"];
const layouts = ["text", "icon"];

test.describe("Button loading width", () => {
  test("keeps its width when `loading` turns on", async ({ page }) => {
    await page.goto("/button-loading-width.html");
    // The webfont changes every label's width when it lands.
    await page.evaluate(() => document.fonts.ready);

    const widths = () =>
      page.evaluate(() =>
        Object.fromEntries(
          [...document.querySelectorAll<HTMLElement>(".bx--btn")].map(
            (node) => [node.dataset.testid, node.getBoundingClientRect().width],
          ),
        ),
      );

    const before = await widths();
    const count = kinds.length * sizes.length * layouts.length;
    expect(Object.keys(before)).toHaveLength(count);

    await page.getByTestId("start-loading").click();
    await expect(page.locator(".bx--btn__loading")).toHaveCount(count);

    expect(await widths()).toEqual(before);
  });

  // Forced colors paint the hidden label anyway, so the spinner steps aside
  // to follow it instead of drawing over it.
  test("keeps the spinner off the label in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/button-loading-width.html");
    await page.getByTestId("start-loading").click();
    await expect(page.locator(".bx--btn__loading")).toHaveCount(
      kinds.length * sizes.length * layouts.length,
    );

    await Promise.all(
      ["ghost", "danger-ghost"].map(async (kind) => {
        const { label, spinner } = await page
          .getByTestId(`${kind}-default-text`)
          .evaluate((button) => {
            const range = document.createRange();
            range.selectNodeContents(button.firstChild as Node);
            return {
              label: range.getBoundingClientRect().right,
              spinner: (
                button.querySelector(".bx--btn__loading") as Element
              ).getBoundingClientRect().left,
            };
          });
        expect(spinner, kind).toBeGreaterThanOrEqual(label);
      }),
    );
  });
});
