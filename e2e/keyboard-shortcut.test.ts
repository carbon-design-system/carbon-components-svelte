import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** The left edge of each key in a shortcut, in DOM order. */
function keyLefts(page: Page, testId: string) {
  return page
    .getByTestId(testId)
    .locator(".bx--kbd")
    .evaluateAll((keys) =>
      keys.map((key) => Math.round(key.getBoundingClientRect().left)),
    );
}

test.describe("KeyboardShortcut", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/keyboard-shortcut.html");
    await expect(page.getByTestId("apple")).toBeVisible();

    const results = await new AxeBuilder({ page }).include("main").analyze();

    expect(results.violations).toEqual([]);
  });

  test("a screen reader hears key names, not glyphs", async ({ page }) => {
    await page.goto("/keyboard-shortcut.html");
    await expect(page.getByTestId("apple")).toBeVisible();

    await expect(page.getByTestId("apple")).toMatchAriaSnapshot(
      "- paragraph: Palette Shift Command P",
    );
    await expect(page.getByTestId("other")).toMatchAriaSnapshot(
      "- paragraph: Palette Control Shift P",
    );
    // Joined muted keys read the same: the plus is not spoken.
    await expect(page.getByTestId("muted")).toMatchAriaSnapshot(
      "- paragraph: Palette Control Shift P",
    );
    await expect(page.getByTestId("decorative")).toMatchAriaSnapshot(
      "- paragraph: Palette",
    );
    await expect(page.getByTestId("button")).toMatchAriaSnapshot(
      '- button "Search"',
    );
  });

  test("keeps the keys in order and at the inline end in right-to-left", async ({
    page,
  }) => {
    await page.goto("/keyboard-shortcut.html?dir=rtl");
    await expect(page.getByTestId("apple")).toBeVisible();

    const lefts = await keyLefts(page, "other");
    expect(lefts).toHaveLength(3);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));

    // In the button, the hint follows the label toward the inline end,
    // which is the left in right-to-left, with a gap between them.
    const [label, hint] = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="button"]');
      const range = document.createRange();
      const text = [...(button?.childNodes ?? [])].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (!(text && button)) throw new Error("no label");
      range.selectNodeContents(text);
      return [
        range.getBoundingClientRect().left,
        button.querySelector(".bx--keyboard-shortcut")?.getBoundingClientRect()
          .right,
      ];
    });
    expect((label as number) - (hint as number)).toBeGreaterThanOrEqual(8);
  });

  test("keeps the keys readable in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/keyboard-shortcut.html");
    await expect(page.getByTestId("apple")).toBeVisible();

    const edge = await page
      .getByTestId("other")
      .locator(".bx--kbd")
      .first()
      .evaluate((key) => {
        const style = getComputedStyle(key);
        return [style.borderBottomWidth, style.borderBottomColor];
      });
    const canvasText = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(edge).toEqual(["2px", canvasText]);
  });
});
