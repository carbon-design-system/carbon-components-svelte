import { expect, test } from "@playwright/test";

test.describe("RangeSlider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/range-slider.html");
  });

  test("renders with initial values", async ({ page }) => {
    await expect(page.getByTestId("value-display")).toHaveText("20");
    await expect(page.getByTestId("value-upper-display")).toHaveText("80");
  });

  test("renders both thumbs with correct aria-valuenow", async ({ page }) => {
    const slider = page.getByTestId("range-slider");
    await expect(slider).toBeVisible();
    const thumbs = slider.locator('[role="slider"]');
    await expect(thumbs).toHaveCount(2);
    await expect(thumbs.nth(0)).toHaveAttribute("aria-valuenow", "20");
    await expect(thumbs.nth(1)).toHaveAttribute("aria-valuenow", "80");
  });

  test("ArrowRight on lower thumb increases the lower bound", async ({
    page,
  }) => {
    const lower = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(0);
    await lower.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("21");
    await expect(page.getByTestId("value-upper-display")).toHaveText("80");
  });

  test("ArrowLeft on upper thumb decreases the upper bound", async ({
    page,
  }) => {
    const upper = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(1);
    await upper.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("value-upper-display")).toHaveText("79");
    await expect(page.getByTestId("value-display")).toHaveText("20");
  });

  test("Shift+arrow uses step multiplier", async ({ page }) => {
    const lower = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(0);
    await lower.focus();
    await page.keyboard.press("Shift+ArrowRight");
    // step=1, range=100, stepMultiplier=4 -> delta = 100/4 = 25 -> 20 + 25 = 45
    await expect(page.getByTestId("value-display")).toHaveText("45");
  });

  test("lower thumb cannot move past upper thumb", async ({ page }) => {
    const lower = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(0);
    await lower.focus();
    // Try to push well past the upper bound (80) using Shift+ArrowRight which
    // adds 25 per press. After 3 presses we'd be at 95 without clamping.
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("80");
    await expect(page.getByTestId("value-upper-display")).toHaveText("80");
  });

  test("upper thumb cannot move below lower thumb", async ({ page }) => {
    const upper = page
      .getByTestId("range-slider")
      .locator('[role="slider"]')
      .nth(1);
    await upper.focus();
    // Shift+ArrowLeft adds -25 per press; three presses would land at 5
    // without clamping against the lower bound (20).
    await page.keyboard.press("Shift+ArrowLeft");
    await page.keyboard.press("Shift+ArrowLeft");
    await page.keyboard.press("Shift+ArrowLeft");
    await expect(page.getByTestId("value-upper-display")).toHaveText("20");
    await expect(page.getByTestId("value-display")).toHaveText("20");
  });

  test("dragging a handle keeps it under the pointer and commits on release", async ({
    page,
  }) => {
    const slider = page.getByTestId("range-slider");
    const track = slider.locator(".bx--slider__track");
    const upperThumb = slider.getByRole("slider").nth(1);
    const box = await track.boundingBox();
    const thumbBox = await upperThumb.boundingBox();
    if (!box || !thumbBox) throw new Error("missing box");
    const y = box.y + box.height / 2;

    // The handle hangs to one side of its value point; grabbing it there
    // must not jump the value to the press point.
    const pressX = thumbBox.x + thumbBox.width / 2;
    const grabOffset = pressX - (box.x + box.width * 0.8);
    await page.mouse.move(pressX, y);
    await page.mouse.down();
    await expect(page.getByTestId("value-upper-display")).toHaveText("80");

    await page.mouse.move(box.x + box.width * 0.6 + grabOffset, y, {
      steps: 4,
    });
    await expect(page.getByTestId("value-upper-display")).toHaveText("60");

    await page.mouse.move(box.x + box.width + 100, y + 150, { steps: 4 });
    await page.mouse.up();
    await expect(page.getByTestId("value-upper-display")).toHaveText("100");
    await expect(page.getByTestId("value-display")).toHaveText("20");
    await expect(page.getByTestId("change-count")).toHaveText("1");
    await expect(upperThumb).toBeFocused();
  });

  test("pressing the track focuses the nearer handle", async ({ page }) => {
    const slider = page.getByTestId("range-slider");
    const box = await slider.locator(".bx--slider__track").boundingBox();
    if (!box) throw new Error("missing track box");

    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height / 2);

    await expect(slider.getByRole("slider").first()).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("31");
  });

  test("trackDrag drags the whole range from inside it", async ({ page }) => {
    const slider = page.getByTestId("range-slider-drag");
    const inner = slider.locator(".bx--slider");
    const box = await slider.locator(".bx--slider__track").boundingBox();
    if (!box) throw new Error("missing track box");
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width * 0.35, y);
    await expect(inner).toHaveCSS("cursor", "grab");

    await page.mouse.down();
    await expect(inner).toHaveCSS("cursor", "grabbing");
    await page.mouse.move(box.x + box.width * 0.55, y, { steps: 4 });
    await expect(page.getByTestId("drag-value-display")).toHaveText("40–70");

    await page.mouse.move(box.x + box.width + 100, y, { steps: 4 });
    await page.mouse.up();
    await expect(page.getByTestId("drag-value-display")).toHaveText("70–100");
  });

  test('trackDrag="brush" paints a new range from outside it', async ({
    page,
  }) => {
    const slider = page.getByTestId("range-slider-drag");
    const box = await slider.locator(".bx--slider__track").boundingBox();
    if (!box) throw new Error("missing track box");
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width * 0.9, y);
    await expect(slider.locator(".bx--slider")).toHaveCSS(
      "cursor",
      "crosshair",
    );
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, y, { steps: 6 });
    // Both handles show the focused arrow while the range is painted.
    const focusIcons = slider.locator(".bx--slider__thumb-icon--focus");
    await expect(focusIcons.first()).toBeVisible();
    await expect(focusIcons.last()).toBeVisible();
    await page.mouse.up();

    await expect(page.getByTestId("drag-value-display")).toHaveText("70–90");
    await expect(focusIcons.first()).toBeHidden();
    await expect(focusIcons.last()).toBeHidden();
  });
});
