import { expect, type Locator, test } from "@playwright/test";

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("not rendered");
  return rect;
};

test.describe("UIShellContainer", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/uishell-container.html");
  });

  test("places the header and side nav against the container, not the window", async ({
    page,
  }) => {
    const shell = page.getByTestId("wide");
    await page.evaluate(() => window.scrollTo(0, 100));

    const container = await box(shell);
    const header = await box(shell.locator(".bx--header"));
    const nav = await box(shell.getByRole("navigation", { name: "Wide nav" }));
    expect(header.y).toBeCloseTo(container.y, 0);
    expect(header.x).toBeCloseTo(container.x, 0);
    expect(header.width).toBeCloseTo(container.width, 0);
    expect(nav.y).toBeCloseTo(container.y + header.height, 0);

    // 1200px is past `lg`: the nav is open beside the content.
    const content = await box(shell.locator(".bx--content"));
    expect(content.x).toBeCloseTo(nav.x + nav.width, 0);
  });

  test("scrolls content inside the container", async ({ page }) => {
    const shell = page.getByTestId("wide");
    const content = shell.locator(".bx--content");
    await content.evaluate((el) => el.scrollTo(0, 200));

    expect(await content.evaluate((el) => el.scrollTop)).toBe(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("collapses the side nav by the container's width", async ({ page }) => {
    const shell = page.getByTestId("narrow");
    const nav = shell.getByRole("navigation", { name: "Narrow nav" });
    await expect(nav).toBeHidden();

    await shell.getByRole("button", { name: "Open menu" }).click();
    await expect(nav).toBeVisible();

    // The overlay covers the container, and the page still scrolls.
    const container = await box(shell);
    const overlay = await box(shell.locator(".bx--side-nav__overlay-active"));
    expect(overlay.width).toBeCloseTo(container.width, 0);
    expect(overlay.height).toBeLessThanOrEqual(container.height + 1);
    await expect(page.locator("body")).not.toHaveClass(
      /bx--body--with-modal-open/,
    );
  });

  test("reports each container's breakpoint", async ({ page }) => {
    await expect(page.getByTestId("wide-size")).toHaveText("lg");
    await expect(page.getByTestId("narrow-size")).toHaveText("sm");
  });

  test("paints its own theme over the page's", async ({ page }) => {
    const background = (testId: string) =>
      page
        .getByTestId(testId)
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    // g100's ui-background on a white page.
    expect(await background("narrow")).toBe("rgb(22, 22, 22)");
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).colorScheme,
      ),
    ).not.toBe("dark");
    expect(
      await page
        .getByTestId("narrow")
        .evaluate((el) => getComputedStyle(el).colorScheme),
    ).toBe("dark");
  });

  test("expands to fill the window and returns to the page", async ({
    page,
  }) => {
    const shell = page.getByTestId("wide");
    const before = await box(shell);

    await shell.getByRole("button", { name: "Expand" }).click();
    await expect(shell).toHaveClass(/bx--ui-shell-container--expanded/);
    const expanded = await box(shell);
    expect(expanded).toEqual({ x: 0, y: 0, width: 1400, height: 900 });
    // Opaque, so the page doesn't show through.
    expect(
      await shell.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(255, 255, 255)");
    await expect(page.locator("body")).toHaveClass(/bx--body--with-modal-open/);
    // Wider than `xlg` now.
    await expect(page.getByTestId("wide-size")).toHaveText("xlg");

    await shell.getByRole("button", { name: "Return to page" }).click();
    await expect(shell).not.toHaveClass(/bx--ui-shell-container--expanded/);
    expect(await box(shell)).toEqual(before);
    await expect(page.locator("body")).not.toHaveClass(
      /bx--body--with-modal-open/,
    );
  });

  test("resizes its side nav by dragging inside the container", async ({
    page,
  }) => {
    const shell = page.getByTestId("wide");
    const nav = shell.getByRole("navigation", { name: "Wide nav" });
    const start = (await box(nav)).width;
    const handle = await box(shell.locator(".bx--side-nav__resize-handle"));
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 40, y, { steps: 4 });
    await page.mouse.up();

    expect((await box(nav)).width).toBeCloseTo(start + 40, 0);
  });
});
