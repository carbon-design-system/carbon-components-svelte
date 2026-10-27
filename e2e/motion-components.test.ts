import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "./helpers/host";

/** Whether a Web Animation is running on the element with this test id. */
const animating = (page: Page, testId: string) =>
  page.evaluate(
    (id) =>
      document
        .getAnimations()
        .some(
          (animation) =>
            (animation.effect as KeyframeEffect | null)?.target?.getAttribute(
              "data-testid",
            ) === id,
        ),
    testId,
  );

async function showLoading(page: Page) {
  await page.goto("/motion-components.html");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByTestId("inline")).toBeVisible();
  // Let the entrance end.
  await expect.poll(() => animating(page, "overlay")).toBe(false);
  await expect.poll(() => animating(page, "inline")).toBe(false);
}

const stop = (page: Page) =>
  page.evaluate(() => window.dispatchEvent(new Event("stop-saving")));

test.describe("Motion on loading components", () => {
  test("fades the status and the overlay out, then returns focus", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await showLoading(page);

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await stop(page);

    await expect.poll(() => animating(page, "inline")).toBe(true);
    await expect.poll(() => animating(page, "overlay")).toBe(true);
    await expect(page.getByTestId("inline")).toHaveCount(0);
    await expect(page.getByTestId("overlay")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeFocused();
  });

  test("removes both at once under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await showLoading(page);

    await stop(page);

    await expect(page.getByTestId("inline")).toHaveCount(0, { timeout: 100 });
    await expect(page.getByTestId("overlay")).toHaveCount(0, { timeout: 100 });
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeFocused();
  });

  test("the leaving overlay stops taking clicks", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await showLoading(page);

    await stop(page);
    await expect.poll(() => animating(page, "overlay")).toBe(true);

    expect(
      await page
        .getByTestId("overlay")
        .evaluate((node) => (node as HTMLElement).inert),
    ).toBe(true);
  });
});
