import { expect, test } from "@playwright/test";

test.describe("StarRating", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/star-rating.html");
  });

  test("moves the rating with arrow keys", async ({ page }) => {
    const group = page.getByTestId("input");
    // WebKit on macOS doesn't tab to radios by default.
    await group.getByRole("radio").first().focus();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect(
      group.getByRole("radio", { name: "3 out of 5 stars" }),
    ).toBeChecked();
    await expect(page.getByTestId("value")).toHaveText("3");
  });

  test("draws the focus ring around the focused star", async ({ page }) => {
    await page.getByTestId("input").getByRole("radio").first().focus();

    const outline = await page
      .getByTestId("input")
      .locator(".bx--star-rating__icon")
      .first()
      .evaluate((icon) => getComputedStyle(icon).outlineStyle);
    expect(outline).toBe("solid");
  });

  test("chooses a star by clicking it", async ({ page }) => {
    await page
      .getByTestId("input")
      .locator(".bx--star-rating__star")
      .nth(3)
      .click();

    await expect(page.getByTestId("value")).toHaveText("4");
  });

  test("fills half of a star for a half rating", async ({ page }) => {
    const fill = page
      .getByTestId("readonly")
      .locator(".bx--star-rating__fill")
      .nth(3);
    const box = await fill.evaluate((node) => {
      const { width } = node.getBoundingClientRect();
      return { width, clip: getComputedStyle(node).clipPath };
    });

    expect(box.width).toBe(24);
    expect(box.clip).toBe("inset(0px 50% 0px 0px)");
  });

  for (const [size, px] of [
    ["sm", 16],
    ["lg", 32],
  ] as const) {
    test(`draws ${size} stars at ${px}px`, async ({ page }) => {
      const width = await page
        .getByTestId(size)
        .locator(".bx--star-rating__icon")
        .first()
        .evaluate((node) => node.getBoundingClientRect().width);

      expect(width).toBe(px);
    });
  }
});
