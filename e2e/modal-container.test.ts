import { expect, test } from "./helpers/host";

/**
 * A Modal inside a container that holds fixed elements fills that
 * container, and its dialog takes the width the container's breakpoint
 * gives it, not the window's. On its own, it fills the window.
 */
// An xlg window, wider than every box.
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("a modal in a container sizes to the container", async ({ page }) => {
  await page.goto("/modal-container.html");

  // Overlay width, then the dialog's share of it at that breakpoint:
  // under md the full width, md 84%, lg 60%.
  for (const [width, share] of [
    [600, 1],
    [800, 0.84],
    [1100, 0.6],
  ] as const) {
    const box = page.getByTestId(`box-${width}`);
    const overlay = await box.locator(".bx--modal").boundingBox();
    const dialog = await box.locator(".bx--modal-container").boundingBox();
    expect.soft(overlay?.width, `${width}px overlay`).toBeCloseTo(width, 0);
    expect.soft(overlay?.height, `${width}px overlay`).toBeCloseTo(500, 0);
    expect
      .soft(dialog?.width, `${width}px dialog`)
      .toBeCloseTo(width * share, 0);
  }
});

test("a small modal in a narrow container spans its text full width", async ({
  page,
}) => {
  await page.goto("/modal-container.html");
  // The window's lg rule gives a small dialog's text 20% right padding;
  // under md the text spans the dialog, as it does in a narrow window.
  const text = page.getByTestId("box-sm").locator(".bx--modal-content > p");
  await expect(text).toHaveCSS("padding-right", "0px");
});

test("a modal on its own fills the window, at the window's breakpoint", async ({
  page,
}) => {
  await page.goto("/modal-container.html");
  const window = page.getByTestId("window");
  const overlay = await window.locator(".bx--modal").boundingBox();
  const dialog = await window.locator(".bx--modal-container").boundingBox();
  expect(overlay?.width).toBeCloseTo(1440, 0);
  expect(overlay?.height).toBeCloseTo(900, 0);
  // An xs dialog at xlg is 24% of the window.
  expect(dialog?.width).toBeCloseTo(1440 * 0.24, 0);
});
