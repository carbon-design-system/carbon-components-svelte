import { expect, test } from "@playwright/test";

test.describe("ProgressBar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/progress-bar.html");
  });

  // A visually hidden label must not leave its row behind. The unit tests
  // can only see the class; the indent or blank row it causes needs layout.
  for (const kind of ["default", "inline", "indented"]) {
    test(`hideLabel leaves no space before the ${kind} track`, async ({
      page,
    }) => {
      const root = page.getByTestId(`hidden-label-${kind}`);
      const track = root.getByRole("progressbar");

      const rootBox = await root.boundingBox();
      const trackBox = await track.boundingBox();
      if (!rootBox || !trackBox) throw new Error("not rendered");

      expect(trackBox.x).toBeCloseTo(rootBox.x, 0);
      expect(trackBox.y).toBeCloseTo(rootBox.y, 0);
    });
  }
});
