import { expect, test } from "./helpers/host";

test.describe("Slider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/slider.html");
  });

  test("renders with initial value", async ({ page }) => {
    await expect(page.getByTestId("value-display")).toHaveText("50");
  });

  test("renders slider component with thumb", async ({ page }) => {
    const slider = page.getByTestId("slider");
    await expect(slider).toBeVisible();
    await expect(slider.locator('[role="slider"]')).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  test("keyboard ArrowRight increases value", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("51");
    await page.keyboard.press("ArrowUp");
    await expect(page.getByTestId("value-display")).toHaveText("52");
  });

  test("keyboard ArrowLeft decreases value", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("value-display")).toHaveText("49");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("value-display")).toHaveText("48");
  });

  test("keyboard with Shift uses step multiplier", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    await page.keyboard.press("Shift+ArrowRight");
    // step=1, range=100, stepMultiplier=4 -> delta = 100/4 = 25
    await expect(page.getByTestId("value-display")).toHaveText("75");
  });

  test("keyboard cannot move the value past max", async ({ page }) => {
    const thumb = page.getByTestId("slider").locator('[role="slider"]');
    await thumb.focus();
    // Shift+ArrowRight adds 25 per press; from 50 three presses would land
    // at 125 without clamping against max (100).
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("100");
    await expect(thumb).toHaveAttribute("aria-valuenow", "100");
  });

  test("shows a four-digit value in full", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: "Monthly limit" });
    await expect(input).toHaveValue("2500");
    // An input's scrollWidth doesn't grow with clipped text, so measure the
    // value against the room inside its padding.
    const fits = await input.evaluate(async (node: HTMLInputElement) => {
      await document.fonts.ready;
      const style = getComputedStyle(node);
      const context = document.createElement("canvas").getContext("2d");
      if (!context) return false;
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const spacing = Number.parseFloat(style.letterSpacing) || 0;
      const text =
        context.measureText(node.value).width + spacing * node.value.length;
      const room =
        node.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      return text <= room;
    });

    expect(fits).toBe(true);
  });

  test("dragging past the track clamps and commits once on release", async ({
    page,
  }) => {
    const track = page.getByTestId("slider").locator(".bx--slider__track");
    const box = await track.boundingBox();
    if (!box) throw new Error("missing track box");
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 4 });
    await expect(page.getByTestId("value-display")).toHaveText("25");

    // Released outside the slider: pointer capture still delivers it.
    await page.mouse.move(1, y + 150, { steps: 4 });
    await page.mouse.up();

    await expect(page.getByTestId("value-display")).toHaveText("0");
    await expect(page.getByTestId("change-count")).toHaveText("1");

    // The drag has ended, so hovering no longer moves the thumb.
    await page.mouse.move(box.x + box.width, y);
    await expect(page.getByTestId("value-display")).toHaveText("0");
  });

  test("pressing the track focuses the thumb", async ({ page }) => {
    const box = await page
      .getByTestId("slider")
      .locator(".bx--slider__track")
      .boundingBox();
    if (!box) throw new Error("missing track box");

    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height / 2);

    await expect(page.getByTestId("slider").getByRole("slider")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("value-display")).toHaveText("31");
  });
});
